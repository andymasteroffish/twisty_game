let player;
let ring;

let disp_angle = 0;
let disp_angle_lerp = 0.03;



const game_w = 100;
const game_h = 100;

const big_scale = 7;

function setup() {
	console.log("hi "+PI);

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
	
}


function draw() {
	background(230);

	update();

	draw_game();
	
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
	clear_grid();

	draw_player(player);
	draw_ring(ring);

	pixel_effects();

	grid2screen();

	fill(255);
	textSize(10);
	let debug_text = "fps:"+floor(frameRate());
	debug_text += "\nvel:"+player.vel;
	debug_text += "\nang:"+player.angle;
	debug_text += "\ndist:"+player.dist;
	debug_text += "\ngroudned:"+player.is_grounded;
	debug_text += "\njumping:"+player.doing_flip_jump;
	text(debug_text, 10,40);

	//fill(255);
	//image(fbo,width-fbo.width,0);


	
}

//grabs our small grid and blows it up to screen size
function grid2screen(){
	loadPixels();
	let demo_col = [0,0,0];
	for (let c = 0; c < game_w; c++) {
		for (let r = 0; r < game_h; r++) {

			let col = grid[c][r];

			//set the full image
			for (let x=c*big_scale; x<(c+1)*big_scale; x++){
				for (let y=r*big_scale; y<(r+1)*big_scale; y++){
					let big_pos = (y*width + x) * 4;

					pixels[big_pos+0] = palette[col][0];
					pixels[big_pos+1] = palette[col][1];
					pixels[big_pos+2] = palette[col][2];

				}		
			}
		}
	}

	updatePixels();
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

		console.log(keyCode);
	}
}






