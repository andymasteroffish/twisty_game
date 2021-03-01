let cur_timer_end_x;
let cur_draw_level_timer = 0;

let timer_display_prc_cutoff = 0.01;
let timer_display_curve = 2;	//curve it so it visualy takes longer to go down when near 0

function draw_timer_bar(){
	//lerp the draw position of the timer
	// let lerp = 0.3;

	// let lerp_target = life_timer;// - timer_display_ticks_lower;

	// cur_draw_level_timer = (1.0-lerp)*cur_draw_level_timer + lerp * lerp_target;

	cur_draw_level_timer = life_timer - get_time_val_in_the_air();

	//bounds
	let padding_x = 10;
	let y_top = 3;
	let height = 4;

	let x_start = padding_x;
	let x_max_end = game_w - padding_x;

	let total_prc = cur_draw_level_timer / max_life_timer;
	if (total_prc < timer_display_prc_cutoff)	total_prc = timer_display_prc_cutoff;
	total_prc = Math.pow(total_prc, timer_display_curve);

	let x_end = (1.0-total_prc)*x_start + total_prc*x_max_end;

	cur_timer_end_x = x_end;

	//all colors we could pick from, starting from green and going to red
	let all_cols = [10, 11, 12, 13, 14, 2, 8, 9];

	//grab the middle color
	let mid_col_id = floor((1.0-total_prc)*all_cols.length);
	let first_col_id = mid_col_id-1;
	let last_col_id = mid_col_id+1;
	if (first_col_id < 0){
		mid_col_id++;
		first_col_id++;
		last_col_id++;
	}
	if (last_col_id >= all_cols.length){
		mid_col_id--;
		first_col_id--;
		last_col_id--;
	}

	//console.log("our colors: "+first_col_id+" , "+mid_col_id+" , "+last_col_id);

	//make the color array. We need to put the first and last colors 3 times to make them actually show up
	let cols = new Array(7);
	for (let i=0; i<3; i++)	cols[i] = all_cols[first_col_id];
	cols[3] = all_cols[mid_col_id]
	for (let i=4; i<7; i++)	cols[i] = all_cols[last_col_id];

	// //green
	// if (total_prc > 0.8 && false){
	// 	cols = [10,10,11,12,12];
	// }
	// //blue
	// else if (total_prc > 0.4 && false){
	// 	cols = [12,12,13,14,14];
	// }
	// //red
	// else {
	// 	cols = [8,8,8,9,9,2,2,2];
	// }

	let zoom = 0.4;
	let speed = 0.03;
	let slide_speed = 0.1;

	for (let x=x_start; x<x_end; x++){
		let y_start = floor( y_top + sin(x*0.5 + frameCount*0.2) * 1 );
		for (let y=y_start; y<y_start+height; y++){
			let noise_val =noise(x*zoom+frameCount*slide_speed, y*zoom, frameCount*speed);
			let col = cols[ floor(noise_val*cols.length) ];
			set_pix(x,y,col);
		}
	}


}