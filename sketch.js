let player;
let ring;

let disp_angle = 0;
let disp_angle_lerp = 0.03;

let fbo;
let big_pic;

const num_ring_steps = 100;
const ring_steps_2_radians = 6.283185/num_ring_steps;

const game_w = 100;
const game_h = 100;

const big_scale = 10

function setup() {
	console.log("hi "+PI);


	noSmooth();

	pixelDensity(1.0);
	fbo = createGraphics(game_w,game_h);
	
	big_pic = createImage(game_w*big_scale, game_h*big_scale);
	

	//createCanvas(window.innerWidth, window.innerHeight);
	createCanvas(game_w*big_scale, game_h*big_scale);

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

function draw_game(){

	fbo.clear();
	fbo.background(0,0,0);

	fbo.push();
	fbo.translate(game_w/2, game_h/2);
	fbo.rotate(-disp_angle + PI/2);
	fbo.translate(-game_w/2, -game_h/2);

	draw_player(player, fbo);
	draw_ring(ring, fbo);

	fbo.pop();

	fbo2screen();

	fill(255);
	textSize(10);
	let debug_text = "fps:"+floor(frameRate());
	debug_text += "\nvel:"+player.vel;
	debug_text += "\nang:"+player.angle;
	text(debug_text, 10,40);

	fill(255);
	image(fbo,width-fbo.width,0);
}

//grabs our small FBO and blows it up to screen size
function fbo2screen(){
	fbo.loadPixels();
	loadPixels();
	let demo_col = [0,0,0];
	for (let c = 0; c < fbo.width; c++) {
		for (let r = 0; r < fbo.height; r++) {
			// if (c==floor(mouseX) && r==floor(mouseY)){
			// 	let pos = (r*fbo.width + c) * 4;
			// 	demo_col[0] = fbo.pixels[pos+0];
			// 	demo_col[1] = fbo.pixels[pos+1];
			// 	demo_col[2] = fbo.pixels[pos+2];
			// 	console.log(fbo.pixels[pos]+" , "+ fbo.pixels[pos+1]+" , "+ fbo.pixels[pos+2])
			// }
			let col = [0,0,0];
			let pos = (r*fbo.width + c) * 4;
			for (let i=0; i<3; i++){
				col[i] = floor( fbo.pixels[pos+i] / 64 ) * 64;
				col[i] *= 2
			}

			//set the full image
			for (let x=c*big_scale; x<(c+1)*big_scale; x++){
				for (let y=r*big_scale; y<(r+1)*big_scale; y++){
					let big_pos = (y*width + x) * 4;
					pixels[big_pos+0] = col[0];
					pixels[big_pos+1] = col[1];
					pixels[big_pos+2] = col[2];
				}		
			}
		}
	}

	updatePixels();
}

function keyPressed(){
	
	if (keyCode == 37){	//left
		player.vel += player.push_per_press;
	}
	if (keyCode == 39){	//right
		player.vel -= player.push_per_press;
	}
}






