const particle_min_initial_force = 0.4;
const particle_max_initial_force = 0.8;

const particle_attraction = 0.05;
const particle_friction = 0.97;

const particle_dist_from_target_to_kill = 5;

function make_particle(_x,_y, _target_x, _target_y, col, _time_val){
	if (_time_val == null){
		
		_time_val = 0;
	}

	let particle = {
		col : col,
		x : _x,
		y : _y,
		target_x : _target_x, 
		target_y : _target_y,
		time_val : _time_val,
		vel_x : 0, 
		vel_y : 0,
		kill_me : false,
		timer : 0
	}

	let a = random(0,TAU);
	let force = random(particle_min_initial_force, particle_max_initial_force);
	particle.vel_x = cos(a) * force;
	particle.vel_y = sin(a) * force;

	return particle;
}

function update_particle(p){
	p.timer ++;

	//if we have a time value, go towards the timer
	if (p.time_val > 0){
		p.target_x = cur_timer_end_x;
	}

	//get angle to our target
	if (p.timer > 20){
		let angle = atan2(p.target_y-p.y, p.target_x-p.x);
		//and push
		p.vel_x += cos(angle) * particle_attraction;
		p.vel_y += sin(angle) * particle_attraction;
	}

	//update position
	p.x += p.vel_x;
	p.y += p.vel_y;

	//friction
	p.vel_x *= particle_friction;
	p.vel_y *= particle_friction;

	//time to die?
	if (dist_sq(p.x,p.y, p.target_x, p.target_y) < particle_dist_from_target_to_kill*particle_dist_from_target_to_kill){
		p.kill_me = true;
	}
}

//returns the total time val of particles still flying around
function get_time_val_in_the_air(){
	let total = 0;

	particles.forEach( p => {
		total += p.time_val;
	});

	return total;
}

function draw_particle(p){
	set_pix(floor(p.x), floor(p.y), p.col);
}