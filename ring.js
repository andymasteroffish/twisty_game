const num_ring_steps = 99;
const ring_steps_2_radians = 6.283185/num_ring_steps;

//placing gems and obstacles
const object_check_dist = 4;	//how far in either direction to check for sudden changes
const max_height_change_for_object = 5;	//deltas of this size or bigger are ignored
const min_dist_between_objects = 8;//7;
const min_obstacle_dist_from_player_start = 5;

function make_ring(level_num){
	let ring = {
		dists: new Array(num_ring_steps),
		gem_spots : [],
		obstacle_spots : []
	}

	let num_gems = 4;
	let num_obstacles = 2;

	let num_chunks = 3;
	let cur_pos = 0;
	//let chunk_sizes = [20, 30, 23, 27 ];
	let chunk_sizes = [33, 33, 33];//[33, 31, 35];

	let cur_dist = random(20,40);
	for (let i=0; i<num_chunks; i++){
		let this_chunk_size = chunk_sizes[i]
		let chunk = get_ring_chunk( this_chunk_size, cur_dist );

		for (let k=0; k<chunk.length; k++){
			ring.dists[ cur_pos ] = chunk[k];
			cur_dist = chunk[k];
			cur_pos++
		}
	}


	//for each post anaylize if we can put a an object here here
	let possible_spots = [];
	let player_pos = map( player.angle, 0, TAU, 0, num_ring_steps);
	for (let i=0; i<num_ring_steps; i++){

		let is_good = true;

		//make sure it's not on a cliff
		for (let k=i-object_check_dist; k<i+object_check_dist; k++){
			let pos_a = (k+num_ring_steps)%num_ring_steps;
			let pos_b = (k+num_ring_steps+1)%num_ring_steps;
			let delta = abs(ring.dists[pos_a] - ring.dists[pos_b])
			if (delta > max_height_change_for_object){
				is_good = false;
			}
		}

		//make sure the player isn't here
		let player_dist = Math.min( Math.min(abs(player_pos-i), abs( (player_pos-num_ring_steps) - i)), abs( (player_pos+num_ring_steps) - i) );
		if ( player_dist < min_obstacle_dist_from_player_start){
			is_good = false;
		}

		if (is_good){
			possible_spots.push(i);
			//ring.gem_spots.push( i);
		}
	}

	//testing
	// while(possible_spots.length > 0){
	// 	//grab oe at random
	// 	let rand_id = floor(random(0,possible_spots.length));
	// 	let this_pos = possible_spots[rand_id];
	// 	ring.gem_spots.push( this_pos );

	// 	//remove all that are close to that
	// 	for (let i=possible_spots.length-1; i>=0; i--){
	// 		if ( abs(possible_spots[i]-this_pos) < min_dist_between_objects){
	// 			possible_spots.splice(i,1);
	// 		}
	// 	}
	// }

	//grab spots for gems and obstacles
	while(possible_spots.length > 0 && (ring.gem_spots.length < num_gems || ring.obstacle_spots.length < num_obstacles)){
		//grab one at random
		let rand_id = floor(random(0,possible_spots.length));
		let this_pos = possible_spots[rand_id];

		//remove all that are close to that
		for (let i=possible_spots.length-1; i>=0; i--){
			if ( abs(possible_spots[i]-this_pos) < min_dist_between_objects){
				possible_spots.splice(i,1);
			}
		}

		//add it to our target list
		if (ring.gem_spots.length < num_gems){
			ring.gem_spots.push( this_pos );
		}
		else{
			ring.obstacle_spots.push( this_pos );
		}
	}

	return ring;
}

function get_ring_chunk(steps, prev_dist){
	let chunk = new Array(steps);

	let type = 0;//floor(random(0,5));

	//flat surface
	if (type == 0){

		let dist = 43 - floor(random(0, 3))*7;
		// if (prev_dist < 39){
		// 	dist = prev_dist + 10;
		// }
		// else{
		// 	dist = prev_dist - 10;
		// }	

		// dist = 35;// Math.min(43,dist);
		for (let i=0; i<steps; i++){
			chunk[i] = dist;
		}
	}

	//curve
	if (type == 1){

		for (let i=0; i<steps; i++){
			let prc = i/steps;
			chunk[i] = (1.0-prc)*25 + prc*45;
		}
	}

	//wall
	if (type == 2){

		let top = Math.max(prev_dist-15, 20);
		if (prev_dist < 26){
			top = 35;
		}
		for (let i=0; i<steps; i++){
			if (i>steps*0.35 && i<steps*0.65){
				chunk[i] = top;
			}
			else{
				chunk[i] = prev_dist;
			}
		}
	}

	//wavy
	if (type == 3){
		let freq = 6;
		for (let i=0; i<steps; i++){
			let prc = i/steps;
			chunk[i] = 37 + sin(prc*PI*freq) * 3;
		}
	}

	//curved triangle
	if (type == 4){
		for (let i=0; i<steps; i++){
			let prc = i/steps;
			chunk[i] = 35 + sin(prc*PI*2) * 5;
		}
	}


	return chunk;
}


function make_lerped_ring(ring_a, ring_b, prc){
	let r = {
		dists: new Array(num_ring_steps)
	}

	for (let i=0; i<num_ring_steps; i++){
		r.dists[i] = (1.0-prc)*ring_a.dists[i] + prc*ring_b.dists[i];
	}

	return r;
}

function angle_at_ring_pos(index){
	return index * ring_steps_2_radians;
}

function draw_ring(ring, scale) {
	let pnts = new Array(num_ring_steps);

	for (let i=0; i<num_ring_steps; i++){
		let angle = i * ring_steps_2_radians + (-disp_angle + PI/2);
		let x = game_x_center + cos(angle) * ring.dists[i] * scale;
		let y = game_y_center + sin(angle) * ring.dists[i] * scale;
		pnts[i] = {x:x, y:y};
	}

	for (let i=0; i<num_ring_steps; i++){
		let next_pnt = pnts[ (i+1)%num_ring_steps ];
		bresenham_line( pnts[i].x, pnts[i].y, next_pnt.x, next_pnt.y);
	}
}



function* do_level_transition() {

	let cols = [4 , 10, 8];
	let scale_to_darken = 0.7;
	//let cols_far = [5 , 11, 9];
	

	//get the ring for the next level
	let new_ring = make_ring(cur_level);

	//trakc the player pos
	let player_cur_dist = player.dist;

	//todo: move these values elsewhere
	let num_depth = 22
	let scale_min = 0.2;

	//create some new rings that lerp between the values
	let transition_rings = new Array(num_depth)

	transition_rings[0] = ring
	transition_rings[0].scale = 1;
	transition_rings[transition_rings.length-1] = new_ring;
	transition_rings[transition_rings.length-1].scale = scale_min

	for (let i=1; i<transition_rings.length-1; i++){
		let prc = i / (num_depth-1);
		//console.log("prc: "+prc);

		transition_rings[i] = make_lerped_ring(ring, new_ring, prc);

		let scale_prc = 1.0 - (i/transition_rings.length);
		transition_rings[i].scale = scale_min + scale_prc * (1.0-scale_min);
	}

	//pause for a sec
	for (let i=0; i<20; i++){
		cur_col = cols[0];
		draw_ring(ring, 1);
		yield null;
	}

	//start by drawing them one by one extending out
	let draw_count = 0;
	while (draw_count < num_depth){
		let end_index = Math.min(draw_count, transition_rings.length);
		for (let i=0; i<end_index; i++){
			cur_col = cols[i%cols.length];
			if (transition_rings[i].scale < scale_to_darken)	cur_col++;
			draw_ring(transition_rings[i], transition_rings[i].scale);
		}
		draw_count++;

		//while we're doing this, move the player to their start height
		let prc =  draw_count / num_depth;
		player.dist = (1.0-prc)*player_cur_dist + prc*player_level_start_dist

		yield null;
	}

	//then start increasing the scale
	while (transition_rings[transition_rings.length-1].scale < 1.0){
		for (let i=0; i<transition_rings.length; i++){
			cur_col = cols[i%cols.length];
			if (transition_rings[i].scale < scale_to_darken)	cur_col++;
			transition_rings[i].scale += 0.05;
			draw_ring(transition_rings[i], transition_rings[i].scale);
		}
		
		// //while we're doing this, move the player to their start height
		// let prc = transition_rings[transition_rings.length-1].scale;// draw_count / num_depth;
		// player.dist = (1.0-prc)*player_cur_dist + prc*player_level_start_dist

		yield null;
	}

	//then get rid of the old ones
	draw_count = 0;
	while (draw_count < num_depth){
		let start_index = Math.min(draw_count, transition_rings.length);
		for (let i=start_index; i<transition_rings.length; i++){
			cur_col = cols[i%cols.length];
			draw_ring(transition_rings[i], transition_rings[i].scale);
		}

		draw_count++;
		yield null;
	}

	//testing
	// while(true){

	// 	for (let i=0; i<transition_rings.length; i++){
	// 		cur_col = cols[i%2];
	// 		draw_ring(transition_rings[i], transition_rings[i].scale);
	// 	}

	// 	yield null
	// }

	doing_level_trans = false;
	reset_level(new_ring);
	yield null;
}






