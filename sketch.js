let player;
let ring;

let disp_angle = 0;
let disp_angle_lerp = 0.03;



const game_w = 100;
const game_h = 100;

const big_scale = 7;

let debug_show_palette = true;

function setup() {
	console.log("hi "+PI);

	let testo = color('#0f0');
	console.log(testo);

	setup_drawing();

	pixelDensity(1.0);

	grid = new Array(game_w);
	for (let i=0; i<game_w; i++){
		grid[i] = new Array(game_h);
	}
	

	//make our window
	createCanvas(game_w*big_scale, game_h*big_scale);

	//create some game objects
	ring = make_ring();
	player = make_player();

	disp_angle = player.angle;

	clear_grid();
	
}


function draw() {
	background(230);

	update();

	draw_game();

	draw_debug();
	
}

function update(){

	player_physics_update(player, ring);

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

}

function draw_game(){
	//clear_grid();

	pixel_effects_early();

	draw_player(player);
	draw_ring(ring);

	pixel_effects();

	grid2screen();

	
}

function draw_debug(){
	fill(255);
	textSize(10);
	textAlign(LEFT, TOP);
	let debug_text = "fps:"+floor(frameRate());
	debug_text += "\nvel:"+player.vel;
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
}






