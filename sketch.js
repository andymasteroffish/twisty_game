const using_twisty_controller = true;

//game values
const game_w = 100;
const game_h = 100;
const big_scale = 7;

const game_x_center = game_w/2;
const game_y_center = game_h/2 + 5;


//components
let player;
let ring;
let gems = [];
let obstacles = [];
let particles = [];

let is_paused = false;

//timer that kills the player
let life_timer;
const max_life_timer = 800;
const time_bonus_per_gem = 80;

//level state
let cur_level = 0;
let level_trans_gen = null;
let doing_level_trans = false;

let level_timer = 0;

//game state
let state;

let high_score = 0;
let new_high_score;

//game over effects
let game_over_timer;
const game_over_time_for_particle_break = 80;
const game_over_time_for_reset = game_over_time_for_particle_break + 60;

//gamera
let disp_angle = 0;
let disp_angle_lerp = 0.03;

//debug toggles
let debug_no_timer = false;
let debug_show_palette = false;
let debug_show_dark_palette = false;
let debug_show_info = false;
let debug_no_cam_rotate = false;
let debug_no_effects = false;
let debug_show_hit_boxes = false;


//recording gameplay
let recording = false;
let rec_frames = [];
let is_exporting_recording = false;
let export_frame = 0;

function preload(){
	drawing_preload();
}

function setup() {


	setup_drawing();
	

	pixelDensity(1.0);

	setup_grid();
	
	//make our window
	createCanvas(game_w*big_scale, game_h*big_scale);

	clear_grid();

	go_to_title();

	title_timer = title_input_lockout;
	title_selector = 0;
	
}

function go_to_title(){
	//dismiss any lingering particles
	particles.forEach( particle => {
		//make sure to turn off the is text flag
		particle.is_text = false;

		//just straight up remove most of them
		if (random(1) < 0.5){
			particle.kill_me = true;
		}
		//have the rest fly away
		else{
			let angle = random(TAU);
			let dist = random(10,50);//game_w * 1.5;
			particle.target_x += cos(angle) * dist;
			particle.target_y += sin(angle) * dist;
		}
	})

	setup_title();
	state = "title";
	is_paused = false;
	
}

function reset_game(){
	state = "game";

	cur_level = 0;
	new_high_score = false;

	life_timer = max_life_timer;
	game_over_timer = 0;

	title_timer = 0;
	title_selector = 0;

	player = make_player();

	disp_angle = player.angle;
	if (debug_no_cam_rotate)	disp_angle = PI/2;

	//start the level
	reset_level( make_ring(cur_level) );
}

function reset_level(_ring){
	
	ring = _ring;

	level_timer = 0;

	player.angle_vel = 0;

	//populate gems
	gems = [];
	ring.gem_spots.forEach(spot =>{
		let angle = angle_at_ring_pos(spot);
		let dist = ring.dists[spot];
		let gem = make_gem(angle, dist);
		gems.push(gem);
	})

	//populate obstacles
	obstacles = [];
	ring.obstacle_spots.forEach(spot =>{
		let angle = angle_at_ring_pos(spot);
		let dist = ring.dists[spot];
		let obstacle = make_obstacle(angle, dist);
		obstacles.push(obstacle);
	})

	// console.log("gems: "+gems.length);
	// console.log("obstacles: "+obstacles.length);
}


function draw() {
	background(230);
	

	if (state == "title"){
		draw_title();
	}

	if (state == "instructions"){
		draw_instructions();
	}

	if (state == "game"){
		update_game();
		draw_game();
	}


	pixel_effects_late();
	grid2screen();



	draw_debug();

	// if (frameCount > 10 && frameCount < 20){
	// 	saveCanvas('myCanvas_'+frameCount, 'jpg');
	// }

	//handle capturing a png sequence
	if (recording){
		console.log("recording "+rec_frames.length);
		let pic = createImage(game_w, game_h);
		pic.loadPixels();
		for (let c = 0; c < game_w; c++) {
			for (let r = 0; r < game_h; r++) {

				let col = grid[c][r];
				pic.set(c,r, palette[col]);
			}
		}
		pic.updatePixels();
		rec_frames.push(pic);

		//photoshop caps me at 500
		// if (rec_frames.length > 500){
		// 	recording = false;
		// 	is_exporting_recording = true;
		// 	export_frame = 0;
		// }
	}

	if (is_exporting_recording){
		if (frameCount % 6 == 0){
			console.log("export "+export_frame+ " / "+rec_frames.length);
			rec_frames[export_frame].save("frame_"+export_frame+".png");
			export_frame++;
			if (export_frame >= rec_frames.length){
				is_exporting_recording = false;
			}
		}
	}
	
}

function update_game(){
	if (is_paused)	return;

	//increase the timer
	level_timer++;

	//update particles
	for(let i=particles.length-1; i>=0; i--){
		update_particle(particles[i]);

		if (particles[i].kill_me){
			particles.splice(i,1);
		}
	}

	//if we're doing the level transition, don't do anything else
	if (doing_level_trans){
		return;
	}

	//reduce life total
	life_timer--;
	if (debug_no_timer) life_timer = max_life_timer;
	if (life_timer <= 0){
		kill_player();
	}

	//move the player
	player_physics_update(player, ring);

	//update gems
	for(let i=gems.length-1; i>=0; i--){
		let gem = gems[i];

		update_hit_pos(gem);

		//did the player collect?
		if (level_timer > immune_on_level_start/2 && hit_check(player, gem, hit_padding_gems)){
			break_gem(gem);
			gems.splice(i,1);
			add_time(time_bonus_per_gem);
		}
	}

	//update obstacles
	for(let i=obstacles.length-1; i>=0; i--){
		let obstacle = obstacles[i];

		update_hit_pos(obstacle);

		//did the player get smashed?
		if (level_timer > immune_on_level_start){
			if (hit_check(player, obstacle, hit_padding_obstacles)){
				kill_player();
			}
		}
	}

	//did they collect all the gems?
	if (gems.length == 0){
		trigger_level_end();
	}
	

	//get our lerp angle for the camera
	if (!player.doing_flip_jump){
		let lerp_target1 = player.angle;
		let lerp_target2 = player.angle + TAU;
		let lerp_target3 = player.angle - TAU;

		let dist1 = abs(lerp_target1 - disp_angle);
		let dist2 = abs(lerp_target2 - disp_angle);
		let dist3 = abs(lerp_target3 - disp_angle);

		let lerp_target = lerp_target1;
		if (dist1 < dist2 && dist1 < dist3){	lerp_target = lerp_target1; }
		if (dist2 < dist1 && dist2 < dist3){	lerp_target = lerp_target2;	}
		if (dist3 < dist1 && dist3 < dist2){	lerp_target = lerp_target3; }

		disp_angle = (1.0-disp_angle_lerp) * disp_angle  + disp_angle_lerp * lerp_target;

		if (disp_angle < 0)		disp_angle += TAU;
		if (disp_angle > TAU)	disp_angle -= TAU;
	}
	if (debug_no_cam_rotate){
		disp_angle = PI/2;
	}
}

function kill_player(){
	//bounce out if they're already dead
	if (player.is_dead)	return;

	break_player(player);
	player.is_dead = true;

	//is this a high score?
	if (cur_level > high_score){
		high_score = cur_level;
		new_high_score = true;
	}
}

function trigger_level_end(){
	obstacles = [];
	
	cur_level++;

	doing_level_trans = true;
	level_trans_gen = do_level_transition();
}

function add_time(val){
	life_timer += val;
	if (life_timer > max_life_timer){
		life_timer = max_life_timer;
	}
}

function draw_game(){

	if (!is_paused){

		if (!debug_no_effects) 	pixel_effects_early();
		else 					clear_grid();

		if (!player.is_dead)	clear_text_grid();

		if (game_over_timer <= game_over_time_for_particle_break){
			//if we're doing the level transition, do that and nothing else
			//doing this in draw so that it can draw in the coroutine
			if (doing_level_trans){
				level_trans_gen.next();
			}
			//only draw the level normally if we're not transitioning
			else{
				cur_col = 4;
				draw_ring(ring, 1);
			}

			if (level_timer > immune_on_level_start || frameCount % 12 < 10 ){
				draw_player(player);
			}

			gems.forEach(gem => {
				draw_gem(gem);
			})

			obstacles.forEach(obs => {
				draw_obstacle(obs);
			})

			//timer
			draw_timer_bar();
		}

		particles.forEach(particle => {
			draw_particle(particle)
		})


		//small score when alive
		if (!player.is_dead){
			draw_number(cur_level, 3, 92, 1, text_grid);
		}

		//do dead stuff
		else{
			game_over_timer++;


			if (game_over_timer == 2){
				clear_text_grid();
			}

			//big effect where we wipe the whole screen
			if (game_over_timer == game_over_time_for_particle_break){
				//clear current particles
				particles = [];

				//make a particle for every pixel on screen
				let pix = get_all_pix();
				let p_range = game_w;
				pix.forEach( p => {
					let target_x = random(-p_range,game_w+p_range);
					let target_y = random(-p_range,game_h+p_range);
					particles.push( make_particle(p.x, p.y, target_x, target_y, p.col) );
				})

				//write the text to the text grid
				let text_scale = 6;
				let text_x = game_w/2 - get_number_width(cur_level, text_scale)/2;
				let text_y = game_h/2 - get_number_height(text_scale)/2;
				draw_number(cur_level, text_x, text_y, text_scale, text_grid);

				let text_pix = get_all_pix_in_text();

				//console.log(text_pix.length +" to "+particles.length+" particles");
				let step_dist = floor(particles.length / text_pix.length) - 1;

				//assign them at random
				for (let i=0; i<text_pix.length; i++){
					let t_x = text_pix[i].x;
					let t_y = text_pix[i].y;

					let is_good = false;
					while(!is_good){
						let particle = particles[i*step_dist];// random(particles);
						if (!particle.is_text){
							is_good = true;
							particle.target_x = t_x;
							particle.target_y = t_y;
							particle.is_text = true;
							particle.col = 12;
							if (new_high_score && random(1)<0.3)	particle.col = 8;
						}
					}
				}

				//turn off the text
				clear_text_grid();
			}


			
		}
		
	}


	if (debug_show_hit_boxes){
		debug_draw_obj(player);
		gems.forEach(gem => {
			debug_draw_obj(gem);
		})
		obstacles.forEach(obs => {
			debug_draw_obj(obs);
		})
	}

	if (is_paused){
		set_pause_grid();
	}

}

function draw_debug(){
	if (debug_show_info && state == "game"){
		fill(255);
		textSize(10);
		textAlign(LEFT, TOP);
		let debug_text = "fps:"+floor(frameRate());
		debug_text += "\nang:"+player.angle;
		debug_text += "\ndist:"+player.dist;
		debug_text += "\ngroudned:"+player.is_grounded;
		debug_text += "\njumping:"+player.doing_flip_jump;
		text(debug_text, 10,10);
	}


	//demoing the palette
	if (debug_show_palette){
		textAlign(CENTER, CENTER);
		let box_size = 20;
		for (let c=0; c<4; c++){
			for (let r=0; r<4; r++){
				let index = r*4 + c;
				let x = box_size*c;
				let y = box_size*r ;
				noStroke();
				fill(palette[index]);
				if (debug_show_dark_palette)	fill(palette[dark_palette[index]]);
				rect(x,y,box_size,box_size);
				fill(0)
				text(index, x+box_size/2, y+box_size/2);
			}
		}
	}
}



function keyPressed(){

	if (state == "game"){
		if (!player.doing_flip_jump && !player.is_dead){
			
			if (keyCode == 37){	//left
				rotary_input(player, 1);
			}
			if (keyCode == 39){	//right
				rotary_input(player, -1);
			}

			if (keyCode == 88){	//X
				start_flip_jump(player);
			}

			//console.log(keyCode);
		}

		if (keyCode == 90){	//Z
			is_paused = !is_paused;
		}

		if (player.is_dead && game_over_timer > game_over_time_for_reset && (keyCode == 90 || keyCode == 88)){
			go_to_title();
		}
	}

	else if (state == "title"){
		if (keyCode == 37){	//left
			title_selector = 0;
		}
		if (keyCode == 39){	//right
			title_selector = 1;
		}
		if (title_timer > title_input_lockout && (keyCode == 90 || keyCode == 88)){	//Z or X
			if (title_selector == 0){
				reset_game();
			}
			if (title_selector == 1){
				state = "instructions";
			}
		}
	}

	else if (state == "instructions"){
		if (keyCode == 90 || keyCode == 88){
			go_to_title();
		}
	}

	if (key == 't'){
		gems = [];
		trigger_level_end();
	}
	if (key == 'r'){
		reset_game();
	}
	if (key == 'p'){
		debug_show_palette = !debug_show_palette;
	}
	if (key == 'd'){
		debug_show_dark_palette = !debug_show_dark_palette;
	}
	if (key == 'e'){
		debug_no_effects = !debug_no_effects;
	}
	if (key == 'h'){
		debug_show_hit_boxes = !debug_show_hit_boxes;
	}
	if (key == 'i'){
		debug_show_info = !debug_show_info;
	}
	if (key == 's'){
		if (!recording){
			recording = true;
		}
		else{
			recording = false;
			is_exporting_recording = true;
			export_frame = 0;
		}
	}
}


function update_hit_pos(obj){
	//get the center of the object
	obj.hit_x = game_x_center + cos(obj.angle) * (obj.dist-obj.size/2);
	obj.hit_y = game_y_center + sin(obj.angle) * (obj.dist-obj.size/2);
}

function hit_check(obj1, obj2, scale){
	return dist(obj1.hit_x, obj1.hit_y, obj2.hit_x, obj2.hit_y) < ((obj1.size + obj2.size)/2)*scale;
}

function dist_sq(x1,y1, x2,y2){
	var a = x1 - x2;
	var b = y1 - y2;
	return  a*a + b*b ;
}


function debug_draw_obj(obj){
	cur_col = 9;
	bresenham_circle(obj.hit_x, obj.hit_y, obj.size/2, 10);
}





