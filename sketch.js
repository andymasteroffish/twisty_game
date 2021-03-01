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

//timer that kills the player
let life_timer;
const max_life_timer = 800;
const time_bonus_per_gem = 50;

//level state
let cur_level = 0;
let level_trans_gen = null;
let doing_level_trans = false;

let level_timer = 0;

//gamera
let disp_angle = 0;
let disp_angle_lerp = 0.03;



//debug toggles
let debug_show_palette = false;
let debug_show_info = false;
let debug_no_cam_rotate = false;
let debug_no_effects = false;
let debug_show_hit_boxes = false;

//recording gameplay
let recording = false;
let rec_frames = [];
let is_exporting_recording = false;
let export_frame = 0;


function setup() {


	setup_drawing();

	pixelDensity(1.0);

	grid = new Array(game_w);
	for (let i=0; i<game_w; i++){
		grid[i] = new Array(game_h);
	}
	

	//make our window
	createCanvas(game_w*big_scale, game_h*big_scale);


	clear_grid();

	reset_game();
	
}

function reset_game(){
	cur_level = 1;

	life_timer = max_life_timer;

	player = make_player();

	disp_angle = player.angle;
	if (debug_no_cam_rotate)	disp_angle = PI/2;

	//start the level
	reset_level( make_ring(cur_level) );
}

function reset_level(_ring){
	
	ring = _ring;

	level_timer = 0;

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
		console.log(obstacle)
		obstacles.push(obstacle);
	})

	console.log("gems: "+gems.length);
	console.log("obstacles: "+obstacles.length);
}


function draw() {
	background(230);

	update_game();

	draw_game();

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
		if (rec_frames.length > 500){
			recording = false;
			is_exporting_recording = true;
			export_frame = 0;
		}
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
			console.log("got em!");
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
}

function trigger_level_end(){
	obstacles = [];
	
	console.log("end level "+cur_level);
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

	if (!debug_no_effects) 	pixel_effects_early();
	else 					clear_grid();

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

	particles.forEach(particle => {
		draw_particle(particle)
	})

	if (!player.is_dead){
		draw_timer_bar();
	}

	pixel_effects_late();

	if (debug_show_hit_boxes){
		debug_draw_obj(player);
		gems.forEach(gem => {
			debug_draw_obj(gem);
		})
		obstacles.forEach(obs => {
			debug_draw_obj(obs);
		})
	}

	grid2screen();

	
}

function draw_debug(){
	if (debug_show_info){
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
				let y = box_size*r + 200;
				noStroke();
				fill(palette[index]);
				rect(x,y,box_size,box_size);
				fill(0)
				text(index, x+box_size/2, y+box_size/2);
			}
		}
	}
}



function keyPressed(){

	if (!player.doing_flip_jump && !player.is_dead){
		
		if (keyCode == 37){	//left
			rotary_input(player, 1);
		}
		if (keyCode == 39){	//right
			rotary_input(player, -1);
		}

		if (keyCode == 90){	//Z
			start_flip_jump(player);
		}

		//console.log(keyCode);
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





