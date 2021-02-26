const max_step_height = 5;
const push_per_press = 0.014;
const slope_push = 0.001;
const max_slope_push = 0.006;

function make_player(){
	let p = {
		angle : PI,
		speed : PI*0.01,
		vel : 0,
		dist: 0,
		fric : 0.95,
		size : 10
	}

	return p;
}

function player_physics_update(player, ring){
	//keep in range
	if (player.angle > TAU)	player.angle -= TAU;
	if (player.angle < 0)	player.angle += TAU;


	//get the player's point on the ring
	let ring_pos = map( player.angle, 0, TAU, 0, num_ring_steps);

	//get the two points it is sitting between
	ring_pos_low = floor(ring_pos);
	ring_pos_high = ceil(ring_pos);
	if (ring_pos_high >= num_ring_steps)	ring_pos_high = 0;

	//check the delta
	let slope = ring.dists[ring_pos_high] - ring.dists[ring_pos_low];

	//get the push for being on the slop
	let cur_slope_push = slope * slope_push;

	//distance can be a lerped value between the two
	let prc = ring_pos % 1;
	let dist = (1.0-prc) * ring.dists[ring_pos_low] + prc * ring.dists[ring_pos_high];

	player.dist = dist;
	

	//attempt to move based on velocity
	let new_angle = player.angle + player.vel;
	let can_move = true

	//are we against a slope that is too steep
	if (player.vel > 0 && slope < -max_step_height){
		can_move = false;
		player.vel = 0;
		cur_slope_push = 0;
		player.angle = ring_pos_low * ring_steps_2_radians;
		
		console.log("ya boy!");
	}
	if (player.vel < 0 && slope > max_step_height){
		can_move = false;
		player.vel = 0;
		cur_slope_push = 0;
		player.angle = ring_pos_high * ring_steps_2_radians;
		
		console.log("ya girl!");
	}

	if (can_move){
		player.angle = new_angle;
	}

	//apply the slope to velocity
	if (abs(cur_slope_push) > max_slope_push){
		cur_slope_push = Math.sign(slope_push) * max_slope_push;
	}
	//console.log("slope push "+slope_push)

	player.vel += cur_slope_push;

	//apply friction
	player.vel *= player.fric;

	// console.log("ring pos: "+ring_pos_low+" , "+ring_pos_high);
	// console.log("slope: "+slope);

}

function draw_player(player){
	// fbo.stroke(0,100,255);
	// fbo.strokeWeight(2);
	// fbo.noFill();


	//place the player (move this to draw)
	let x = game_w/2 + cos(player.angle +(-disp_angle + PI/2)) * (player.dist - player.size/2);
	let y = game_h/2 + sin(player.angle +(-disp_angle + PI/2)) * (player.dist - player.size/2);

	// console.log("player speed "+player.speed);
	// console.log("player angle "+player.angle);

	// let dist = 30;
	// let x = fbo.width/2 + cos(player.angle) * dist;
	// let y = fbo.height/2 + sin(player.angle) * dist;
	
	//fbo.circle(x, y, player.size);
	cur_col = 2;
	bresenham_circle(x,y, player.size/2, 10);
}

