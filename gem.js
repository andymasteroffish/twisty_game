const gem_cols = [10, 11];
const spawn_growth_time = 40;

function make_gem(angle, dist){
	let gem = {
		angle : angle,
		dist : dist,
		size : 12,
		hit_x : 0,		//x and y are derived	
		hit_y : 0,
		draw_x : 0,
		draw_y : 0,
		timer : 0
	}

	return gem;
}

function draw_gem(g){
	g.timer++;

	cur_col = 10;

	let draw_angle = g.angle +(-disp_angle + PI/2);

	let center_x = game_w/2 + cos(draw_angle) * (g.dist-g.size/2);
	let center_y = game_h/2 + sin(draw_angle) * (g.dist-g.size/2);
	g.draw_x = center_x;
	g.draw_y = center_y;

	let tan_angle = draw_angle + PI/2;

	let gem_h = 6;
	let gem_w = 5;

	if (g.timer < spawn_growth_time){
		let prc = g.timer / spawn_growth_time;
		gem_h *= prc;
		gem_w *= prc;
	}

	let far_pnt = {
		x : center_x + cos(draw_angle) * gem_h,
		y : center_y + sin(draw_angle) * gem_h
	}
	let near_pnt = {
		x : center_x - cos(draw_angle) * gem_h,
		y : center_y - sin(draw_angle) * gem_h
	}

	let legs = []
	for (let i=0; i<3; i++){
		let spin_angle = frameCount*0.05 + i * (TAU/3);
		let spread_dist = gem_w * sin( spin_angle);

		let mid_prc = 0.5 + cos(spin_angle) * 0.15
		let mid_x = (1.0-mid_prc)*near_pnt.x + mid_prc*far_pnt.x;
		let mid_y = (1.0-mid_prc)*near_pnt.y + mid_prc*far_pnt.y;

		let leg = {
			x: mid_x + cos(tan_angle) * spread_dist,
			y: mid_y + sin(tan_angle) * spread_dist,
			col : ((spin_angle+PI/2)%TAU) > PI ? gem_cols[0] : gem_cols[1]
		}
		legs.push(leg);
	}

	legs.sort((a, b) => (a.col < b.col) ? 1 : -1)


	//bresenham_line(left_x, left_y, right_x, right_y);
	for (let i=0; i<legs.length; i++){
		cur_col = legs[i].col;
		bresenham_line(near_pnt.x, near_pnt.y, legs[i].x, legs[i].y);
		bresenham_line(far_pnt.x, far_pnt.y, legs[i].x, legs[i].y);

		bresenham_line(legs[i].x, legs[i].y, legs[(i+1)%legs.length].x, legs[(i+1)%legs.length].y);
	}
	//bresenham_circle(center_x, center_y, 3, 4);
}


function break_gem(g){
	//find all pixels matching our colors near us
	let pix = get_matching_pic_in_circle(g.draw_x, g.draw_y, g.size/2, gem_cols);

	let time_val = time_bonus_per_gem / pix.length ;

	//make them particles
	pix.forEach( p => {
		particles.push( make_particle(p.x, p.y, cur_timer_end_x, random(3,8), p.col, time_val) );
	})
}