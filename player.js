//Player values
const push_per_press = 0.014;

const slope_push = 0.001;
const max_slope_push = 0.006;

const max_step_height = 5;

const gravity = 0.03;
const dist_to_snap_to_ground = 0.1;

const flip_jump_time_per_pixel = 1;

function make_player(){
	let p = {
		angle : PI,
		dist: 0,
		speed : PI*0.01,
		angle_vel : 0,
		dist_vel : 0,
		is_grounded : false,
		fric : 0.95,
		size : 10,
		doing_flip_jump : false,
		flip_jump_gen : null
	}

	return p;
}

function rotary_input(player, dir){
	player.angle_vel += push_per_press * dir;
}

function player_physics_update(player, ring){

	//if we're in the middle of a flip jump, just do that and bounce out
	if (player.doing_flip_jump){
		player.flip_jump_gen.next();
		return;
	}


	//keep in range
	if (player.angle > TAU)	player.angle -= TAU;
	if (player.angle < 0)	player.angle += TAU;


	//get the player's point on the ring
	let ring_pos = map( player.angle, 0, TAU, 0, num_ring_steps);

	//get the two points it is sitting between
	let ring_pos_low = floor(ring_pos);
	let ring_pos_high = ceil(ring_pos);
	if (ring_pos_high >= num_ring_steps)	ring_pos_high = 0;

	//check the delta
	let slope = ring.dists[ring_pos_high] - ring.dists[ring_pos_low];

	//get the push for being on the slop
	let cur_slope_push = slope * slope_push;

	//distance can be a lerped value between the two
	let prc = ring_pos % 1;
	let dist = (1.0-prc) * ring.dists[ring_pos_low] + prc * ring.dists[ring_pos_high];
	//adjust for player size
	dist -= player.size/2;

	//apply gravity
	player.dist_vel += gravity;
	player.dist += player.dist_vel;

	//if the player is greater or equal to it, they're grounded
	if (player.dist >= dist - dist_to_snap_to_ground){
		player.dist = dist;
		player.is_grounded = true;
		player.dist_vel = 0;
	}
	//otherwise they are in the air
	else{
		player.is_grounded = false;
	}
	

	//attempt to move angularly based on velocity
	let new_angle = player.angle + player.angle_vel;
	let can_move = true

	//are we against a slope that is too steep
	if (player.angle_vel > 0 && slope < -max_step_height){
		can_move = false;
		player.angle_vel = 0;
		cur_slope_push = 0;
		player.angle = ring_pos_low * ring_steps_2_radians;
	}
	if (player.angle_vel < 0 && slope > max_step_height){
		can_move = false;
		player.angle_vel = 0;
		cur_slope_push = 0;
		player.angle = ring_pos_high * ring_steps_2_radians;
	}

	if (can_move){
		player.angle = new_angle;
	}

	//apply the slope to velocity if we're grounded
	if (player.is_grounded){
		if (abs(cur_slope_push) > max_slope_push){
			cur_slope_push = Math.sign(slope_push) * max_slope_push;
		}
		player.angle_vel += cur_slope_push;
	}

	

	//apply friction
	player.angle_vel *= player.fric;

	// console.log("ring pos: "+ring_pos_low+" , "+ring_pos_high);
	// console.log("slope: "+slope);
}

function start_flip_jump(p){
	console.log("JUMP")
	p.doing_flip_jump = true;
	p.flip_jump_gen = do_flip_jump(p);
}

function* do_flip_jump(p) {
	p.doing_flip_jump = true;

	//angle flips
	let start_angle = p.angle;
	let end_angle = (p.angle + PI) % TAU;

	let start_disp_angle = disp_angle;
	let end_disp_angle = disp_angle+PI;

	//start distance is where we are
	let start_dist = p.dist;

	//end dist is the dist on the other side. Just rounding this at least for now
	let ring_pos = map( (player.angle+PI)%TAU, 0, TAU, 0, num_ring_steps);
	let ring_pos_low = floor(ring_pos);
	let end_dist = ring.dists[ring_pos_low] - p.size/2

	let timer = 0;

	let total_time = (start_dist+end_dist) * flip_jump_time_per_pixel

	while (timer < total_time){
		timer++

		let prc_raw = timer / total_time;
		let move_prc = Math.pow(prc_raw, 1.5);


		let cam_prc = 0;
		let cam_start_val = 0.4;
		if (prc_raw > cam_start_val){
			cam_prc = (prc_raw-cam_start_val) / (1.0-cam_start_val);
		}
		cam_prc = Math.pow(cam_prc, 2);

		//treating the distance from where we are to the center as negativ
		let cur_dist = (1.0-move_prc)*(-start_dist) + move_prc * (end_dist);
		p.dist = abs(cur_dist);
		if (cur_dist > 0){
			p.angle = end_angle;
		}

		//have the camera track
		disp_angle = (1.0-cam_prc)*start_disp_angle + cam_prc * end_disp_angle;

		yield null;
	}

	//keep everything in range
	p.dist = abs(p.dist);
	p.angle = end_angle;
	p.angle = p.angle % TAU;
	disp_angle = disp_angle % TAU;

	//we're done!
	p.angle_vel = 0;
	p.dist_vel = 0;
	p.doing_flip_jump = false;
	console.log("final dist "+p.dist);
	return null;
}

function draw_player(player){

	//get the center of the player
	let x = game_w/2 + cos(player.angle +(-disp_angle + PI/2)) * player.dist;
	let y = game_h/2 + sin(player.angle +(-disp_angle + PI/2)) * player.dist;

	cur_col = 2;
	bresenham_circle(x,y, player.size/2, 10);

	//spokes
	let num_spokes = 4;
	for (let i=0; i<num_spokes; i++){
		let fake_angle = -player.angle  * player.dist * 0.13;
		let a =  fake_angle + (TAU/num_spokes) * i -disp_angle;
		let sx = x + cos(a) * player.size/2;
		let sy = y + sin(a) * player.size/2;
		bresenham_line(x,y, sx, sy);

	}

}

