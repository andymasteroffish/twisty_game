const num_ring_steps = 100;
const ring_steps_2_radians = 6.283185/num_ring_steps;

function make_ring(level_num){
	let ring = {
		dists: new Array(num_ring_steps),
		gem_spots : [],
		obstacle_spots : []
	}

	//testing
	for (let i=0; i<num_ring_steps; i++){
		let prc = i / num_ring_steps;
		let test_level_num = level_num % 3;
		if (test_level_num == 0){
			if ((i+10)%num_ring_steps < num_ring_steps/2){
				ring.dists[i] = 20;
			}else{
				ring.dists[i] = 40;
			}
		}
		else if (test_level_num == 2){
			
			ring.dists[i] = 30 + sin(i*0.4) * 3;
		}
		else{
			ring.dists[i] = (1.0-prc)*20 + prc*40;
		}
	}

	for (let i=0; i<5; i++){
		ring.gem_spots.push(i*20 + 4);
		
	}

	//grab some and make it an obstacle
	for (let i=0; i<2; i++){
		let rand_id = Math.floor( random(ring.gem_spots.length));
		ring.obstacle_spots.push( ring.gem_spots[rand_id] );
		ring.gem_spots.splice(rand_id,1);
	}

	return ring;
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
		let x = game_w/2 + cos(angle) * ring.dists[i] * scale;
		let y = game_h/2 + sin(angle) * ring.dists[i] * scale;
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






