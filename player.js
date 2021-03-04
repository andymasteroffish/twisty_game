//Player values
const push_per_press = 0.019;

const slope_push = 0.001;
const max_slope_push = 0.006;

const max_step_height = 5;

const gravity = 0.03;
const dist_to_snap_to_ground = 0.1;

const player_level_start_dist = 10;

const flip_jump_time_per_pixel = 1;

const hit_padding_gems = 0.8;
const hit_padding_obstacles = 0.7;

const immune_on_level_start = 70;

function make_player(){
	let p = {
		angle : PI,
		dist: player_level_start_dist,
		speed : PI*0.01,
		angle_vel : 0,
		dist_vel : 0,
		is_grounded : false,
		fric : 0.95,
		size : 10,
		hit_x : 0,	//x and y are derived form angle and dist
		hit_y : 0,
		draw_x : 0,
		draw_y : 0,
		doing_flip_jump : false,
		flip_jump_gen : null,
		is_dead : false
	}

	return p;
}

function rotary_input(player, dir){
	player.angle_vel += push_per_press * dir;
}


function player_physics_update(p, ring){
	if (p.is_dead)	return;

	//if we're in the middle of a flip jump, just do that and bounce out
	if (p.doing_flip_jump){
		p.flip_jump_gen.next();
		return;
	}


	//keep in range
	if (p.angle > TAU)	p.angle -= TAU;
	if (p.angle < 0)	p.angle += TAU;


	//get the player's point on the ring
	let ring_pos = map( p.angle, 0, TAU, 0, num_ring_steps);

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
	dist -= p.size/2;

	//set the hit pos
	p.hit_x = game_x_center + cos(p.angle) * (p.dist);
	p.hit_y = game_y_center + sin(p.angle) * (p.dist);

	//apply gravity
	p.dist_vel += gravity;
	p.dist += p.dist_vel;

	//if the player is greater or equal to it, they're grounded
	if (p.dist >= dist - dist_to_snap_to_ground){
		p.dist = dist;
		p.is_grounded = true;
		p.dist_vel = 0;
	}
	//otherwise they are in the air
	else{
		p.is_grounded = false;
	}
	

	//attempt to move angularly based on velocity
	let new_angle = p.angle + p.angle_vel;
	let can_move = true

	//are we against a slope that is too steep
	if (p.angle_vel > 0 && slope < -max_step_height){
		can_move = false;
		p.angle_vel = 0;
		cur_slope_push = 0;
		p.angle = ring_pos_low * ring_steps_2_radians;
	}
	if (p.angle_vel < 0 && slope > max_step_height){
		can_move = false;
		p.angle_vel = 0;
		cur_slope_push = 0;
		p.angle = ring_pos_high * ring_steps_2_radians;
	}

	if (can_move){
		p.angle = new_angle;
	}

	//apply the slope to velocity if we're grounded
	if(p.is_grounded){
		if (abs(cur_slope_push) > max_slope_push){
			cur_slope_push = Math.sign(slope_push) * max_slope_push;
		}
		p.angle_vel += cur_slope_push;
	}

	

	//apply friction
	p.angle_vel *= p.fric;

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

		//set the hit pos
		p.hit_x = game_x_center + cos(p.angle) * (p.dist);
		p.hit_y = game_y_center + sin(p.angle) * (p.dist);

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
	return null;
}

function draw_player(p){
	if (p.is_dead)	return;

	//get the center of the player
	let x = game_x_center+ cos(p.angle +(-disp_angle + PI/2)) * p.dist;
	let y = game_y_center + sin(p.angle +(-disp_angle + PI/2)) * p.dist;
	p.draw_x = x;
	p.draw_y = y;
	

	let fake_angle = -p.angle  * p.dist * 0.13;


	//get some info for drawing globe lines
	let selection_angle_base = fake_angle;

	let num_globe_lines = 18;
	let num_line_sections = 5;
	for (let d=0; d<num_globe_lines; d++){
		let prc_angle =  frameCount*0.02 + d * (TAU/num_globe_lines);
		//decided not to show lines in the back
		if ((prc_angle%TAU) < PI){
			let y_prc = 0.5+cos(prc_angle)*0.5;		//1=top, 0=bottom
			//console.log("y prc "+y_prc);;

			let selection_angle_dist = y_prc * PI;// + fake_angle;

			let start = {
				x : x + cos(selection_angle_base+selection_angle_dist) * p.size/2,
				y : y + sin(selection_angle_base+selection_angle_dist) * p.size/2
			}

			let end = {
				x : x + cos(selection_angle_base-selection_angle_dist ) * p.size/2,
				y : y + sin(selection_angle_base-selection_angle_dist) * p.size/2
			}

			cur_col = d%2==0 ? 12 : 13;
			bresenham_line(start.x, start.y, end.x, end.y);

		}

		// cur_col = 8;
		// bresenham_circle(start.x, start.y, 2, 4);
		// cur_col = 10;
		// bresenham_circle(end.x, end.y, 2, 4);
	}


	cur_col = 12;
	//bresenham_circle(x,y, p.size/2, 20);
	

	//recurse_circle(x,y, fake_angle, p.size/2, 0);
}

function break_player(p){
	//find all pixels matching our colors near us
	let pix = get_matching_pix_in_circle(p.draw_x, p.draw_y, p.size/2, [12,13]);

	console.log("player particles: "+pix.length);

	//make them particles
	pix.forEach( p => {
		for (let i=0; i<10; i++){
			particles.push( make_particle(p.x, p.y, random(0,game_w) , random(0,game_h), p.col) );
		}
	})
}

function recurse_circle(x,y, angle, size, depth){
	
	//console.log("circle size: "+size);
	

	if (depth < 5){
		let push_dist = size * 0.2;
		let new_x = x + cos(angle) * push_dist;
		let new_y = y + sin(angle) * push_dist;

		recurse_circle(new_x, new_y, angle*1.1, size*0.8, depth+1);
	}

	cur_col = depth % 2 == 0 ? 12 : 13;
	bresenham_circle(x,y, size, 10);
}

