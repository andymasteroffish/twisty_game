let player;
let ring;
let gems = [];
let obstacles = [];
let particles = [];

let disp_angle = 0;
let disp_angle_lerp = 0.03;



const game_w = 100;
const game_h = 100;

const big_scale = 7;

let debug_show_palette = true;
let debug_no_cam_rotate = false;
let debug_no_effects = false;

function setup() {

	setup_drawing();

	pixelDensity(1.0);

	grid = new Array(game_w);
	for (let i=0; i<game_w; i++){
		grid[i] = new Array(game_h);
	}
	

	//make our window
	createCanvas(game_w*big_scale, game_h*big_scale);

	//create some game objects
	//ring = make_ring();
	player = make_player();

	disp_angle = player.angle;
	if (debug_no_cam_rotate)	disp_angle = PI/2;

	clear_grid();

	reset_level();
	
}

function reset_level(){
	gems = [];

	//get the level shape
	ring = make_ring();

	//populate gems
	ring.gem_spots.forEach(spot =>{
		let angle = angle_at_ring_pos(spot);
		let dist = ring.dists[spot];
		let gem = make_gem(angle, dist);
		gems.push(gem);
	})

	//populate obstacles
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
	
}

function update_game(){

	//move the player
	player_physics_update(player, ring);

	//update gems
	for(let i=gems.length-1; i>=0; i--){
		let gem = gems[i];

		update_hit_pos(gem);

		//did the player collect?
		if (hit_check(player, gem)){
			console.log("got em!");
			break_gem(gem);
			gems.splice(i,1);
		}
	}

	//update obstacles
	for(let i=obstacles.length-1; i>=0; i--){
		let obstacle = obstacles[i];

		update_hit_pos(obstacle);

		//did the player get smashed?
		if (hit_check(player, obstacle)){
			console.log("kill em!");
		}
	}

	//update particles
	for(let i=particles.length-1; i>=0; i--){
		update_particle(particles[i]);

		if (particles[i].kill_me){
			particles.splice(i,1);
		}
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

function draw_game(){
	

	if (!debug_no_effects) 	pixel_effects_early();
	else 					clear_grid();

	draw_ring(ring);

	draw_player(player);

	gems.forEach(gem => {
		draw_gem(gem);
		//debug_draw_obj(gem);
	})

	obstacles.forEach(obs => {
		draw_obstacle(obs);
		//debug_draw_obj(gem);
	})

	particles.forEach(particle => {
		draw_particle(particle)
	})

	//debug_draw_obj(player);

	pixel_effects_late();

	grid2screen();

	
}

function draw_debug(){
	fill(255);
	textSize(10);
	textAlign(LEFT, TOP);
	let debug_text = "fps:"+floor(frameRate());
	debug_text += "\nang:"+player.angle;
	debug_text += "\ndist:"+player.dist;
	debug_text += "\ngroudned:"+player.is_grounded;
	debug_text += "\njumping:"+player.doing_flip_jump;
	text(debug_text, 10,10);


	//demoing the palette
	if (debug_show_palette){
		textAlign(CENTER, CENTER);
		let box_size = 20;
		for (let c=0; c<4; c++){
			for (let r=0; r<4; r++){
				let index = r*4 + c;
				let x = width - box_size*4 + c*box_size;
				let y = box_size*r;
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

	if (!player.doing_flip_jump){
		
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

	if (key == 'p'){
		debug_show_palette = !debug_show_palette;
	}
	if (key == 'e'){
		debug_no_effects = !debug_no_effects;
	}
}


function update_hit_pos(obj){
	//get the center of the object
	obj.hit_x = game_w/2 + cos(obj.angle) * (obj.dist-obj.size/2);
	obj.hit_y = game_h/2 + sin(obj.angle) * (obj.dist-obj.size/2);
}

function hit_check(obj1, obj2){
	return dist(obj1.hit_x, obj1.hit_y, obj2.hit_x, obj2.hit_y) < (obj1.size + obj2.size)/2;
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





