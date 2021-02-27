let obstacle_cols = [8, 9, 8, 9, 8, 6, 9, 6, 6];

function make_obstacle(angle, dist){
	let o = {
		angle: angle,
		dist : dist,
		size : 10,
		hit_x : 0,		//x and y are derived	
		hit_y : 0,
	}

	return o;
}


function draw_obstacle(o){

	cur_col = obstacle_cols[0];

	let draw_angle = o.angle +(-disp_angle + PI/2);

	let dist_bonus = sin(frameCount*0.1) * 2 - 1;
	let top_dist = (o.dist - o.size) + dist_bonus;

	let top_x = game_w/2 + cos(draw_angle) * top_dist;
	let top_y = game_h/2 + sin(draw_angle) * top_dist;

	// let bottom_x = game_w/2 + cos(draw_angle) * (o.dist);
	// let bottom_y = game_h/2 + sin(draw_angle) * (o.dist);

	let angle_range = PI/6;
	let angle_steps = 8;

	let angle_start = draw_angle - angle_range;
	let angle_end = draw_angle + angle_range;

	let pix_steps = 10;

	for (let i=0; i<angle_steps; i++){
		let angle_prc = i / angle_steps;
		let a = (1.0-angle_prc)*angle_start + angle_prc * angle_end;

		let end_pnt = {
			x : top_x + cos(a) * (o.size - dist_bonus),
			y : top_y + sin(a) * (o.size - dist_bonus)
		}

		for (let k=0; k<pix_steps; k++){
			let prc = 1.0- k/pix_steps;
			let p_x = floor( (1.0-prc)*end_pnt.x + prc*top_x );
			let p_y = floor( (1.0-prc)*end_pnt.y + prc*top_y );

			//let col_index = (k+frameCount*0.02*(i+1)) % 3;
			let zoom = 0.4;
			let speed = 0.01;
			let col_index = noise(k*zoom+frameCount*0.1, i*zoom, frameCount*speed) * obstacle_cols.length;

			set_pix(p_x, p_y, obstacle_cols[floor(col_index)]);
		}

		//bresenham_line(top_x, top_y, end_pnt.x, end_pnt.y);

	}

	
	

	
	
	//bresenham_circle(bottom_x, bottom_y, 2, 5);
	//bresenham_circle(top_x, top_y, 2, 5);

}