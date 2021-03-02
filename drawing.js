let grid, pause_grid;

let palette = new Array(16);
let dark_palette = new Array(16);
let cur_col = 0;

let paused_img;

let cur_pause_angle = 0;

function drawing_preload(){
	paused_img = loadImage('pic/paused.png');
	console.log(paused_img)
}

// Using NA16 PALETTE by Nauris
// https://lospec.com/palette-list/na16
function setup_drawing(){
	palette[0] = color('#1f0e1c');
	palette[1] = color('#f5edba');
	palette[2] = color('#e4943a');
	palette[3] = color('#9a6348');

	palette[4] = color('#8c8fae');
	palette[5] = color('#584563');
	palette[6] = color('#70377f');
	palette[7] = color('#3e2137');

	palette[8] = color('#d26471');
	palette[9] = color('#9d303b');
	palette[10] = color('#c0c741');
	palette[11] = color('#647d34');

	palette[12] = color('#7ec4c1');
	palette[13] = color('#34859d');
	palette[14] = color('#17434b');
	palette[15] = color('#1f0e1c');


	dark_palette[0] = 0;
	dark_palette[1] = 2;
	dark_palette[2] = 3;
	dark_palette[3] = 7;

	dark_palette[4] = 5;
	dark_palette[5] = 7;
	dark_palette[6] = 7;
	dark_palette[7] = 15;

	dark_palette[8] = 9;
	dark_palette[9] = 3;
	dark_palette[10] = 11;
	dark_palette[11] = 14;

	dark_palette[12] = 13;
	dark_palette[13] = 14;
	dark_palette[14] = 15;
	dark_palette[15] = 0;
}

function setup_grid(){

	grid = new Array(game_w);
	for (let i=0; i<game_w; i++){
		grid[i] = new Array(game_h);
	}

	pause_grid = new Array(game_w);
	for (let x=0; x<game_w; x++){
		pause_grid[x] = new Array(game_h);
		for (let y=0; y<game_h; y++){
			pause_grid[x][y] = {
				c : 0,
				a : atan2(y-game_w/2, x-game_h/2),
				d : dist(x,y, game_w/2, game_h/2),
				v : 99999 
			}

			pause_grid[x][y].v -= pause_grid[x][y].d*0.1;
		}
	}
}

function clear_grid() {
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			grid[x][y] = 0;
		}
	}
}

function pixel_effects_early(){
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){

			let c = grid[x][y];
			if (c>0 ){
				//chance to just turn the pixel off
				if(random(9)<1)	set_pix(x,y,0);

				//figure out what the next color would be (if no color is listed for the current value, we go to 0)
				let next_col = 0;
				//ring colors
				// if (c==4)	next_col = 5;
				// if (c==5)	next_col = 6;
				// if (c==6)	next_col = 3;//random(1) < 0.5 ? 7 : 3;
				// if (c==3)	next_col = 7;

				if (c==4)	next_col = 5;
				if (c==5)	next_col = 6;
				if (c==6)	next_col = random(1) < 0.85 ? 7 : 3;
				if (c==3)	next_col = 7;
				
				//player colors
				if (c == 12)	next_col = random(1) < 0.65 ? 13 : 12;
				if (c == 13)	next_col = 14;
				if (c == 14)	next_col = 15;
				//gem colors
				if (c == 10)	next_col = 11;
				if (c == 11)	next_col = 14;
				//obstacle colors
				if (c == 1)	next_col = 8;
				if (c == 8)	next_col = 9;
				if (c == 9)	next_col = 2;
				//if (c == 6)	next_col = 7;


				//try to advance and move
				set_pix(x-1+floor(random(3)), y-floor(random(2)), next_col);
				

				//and possibly jump up
				if(random(9)<2 && c>1)	set_pix(x,y-2, c)
			}
		}
	}
}

function pixel_effects_late() {
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
		}
	}
}

function set_pause_grid(){
	cur_pause_angle += 0.1;
	if (cur_pause_angle >= PI)	cur_pause_angle -= TAU;
	let angle_dist_to_advance = 1.5;
	let angle_dist_to_fade = 2.1;
	let angle_dist_to_clear = 2.5;

	let p_cols = [1,1,1,4,12,12,12];
	paused_img.loadPixels();
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			pause_grid[x][y].c = dark_palette[grid[x][y]];

			let index = ((y*game_w) + x) * 4;
			if (paused_img.pixels[index] > 150){

				let n1 = pause_grid[x][y].a*0.41;
				let n2 = 99999 + pause_grid[x][y].d*0.1 - frameCount*0.05;

				let ang_dist = Math.min( 
					abs(cur_pause_angle - pause_grid[x][y].a),
					Math.min(abs(cur_pause_angle+TAU - pause_grid[x][y].a),
						abs(cur_pause_angle-TAU - pause_grid[x][y].a)
					)
				);

				if (ang_dist < angle_dist_to_advance){
					let prc = 1.0-ang_dist/angle_dist_to_advance;
					pause_grid[x][y].v -= prc * 0.1;
				}
				n2 = pause_grid[x][y].v;
				let col_index = noise(n1, n2) * p_cols.length;
				pause_grid[x][y].c = p_cols[floor(col_index)];

				if (ang_dist > angle_dist_to_fade){
					pause_grid[x][y].c = dark_palette[pause_grid[x][y].c];
				}
				if (ang_dist > angle_dist_to_clear){
					pause_grid[x][y].c = dark_palette[grid[x][y]];
				}
			}
		}
	}
}

function set_pix(x,y,c){
	if (x>=0 && x<game_w && y>=0 && y<game_h){
		grid[x][y] = c;
	}
}

function get_matching_pic_in_circle(center_x, center_y, range, match_cols){
	center_x = floor(center_x);
	center_y = floor(center_y);
	range = floor(range);

	let start_x = Math.max(0, center_x - range);
	let end_x = Math.min(game_w-1, center_x + range);

	let start_y = Math.max(0, center_y - range);
	let end_y = Math.min(game_h-1, center_y + range);

	let return_val = [];

	for (let x=start_x; x<=end_x; x++){
		for (let y=start_y; y<=end_y; y++){
			//todo: actually do a circle

			//check if this pixel is in the match list
			if (match_cols.includes(grid[x][y])){
				return_val.push( {
					x : x,
					y : y,
					col : grid[x][y]
				})
			}

		}
	}

	return return_val;
}


//https://en.wikipedia.org/wiki/Bresenham's_line_algorithm
//https://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
function bresenham_line(x0, y0, x1, y1) {
	//no floating point numbers
	x0 = floor(x0);
	y0 = floor(y0);
	x1 = floor(x1);
	y1 = floor(y1);

	var dx = Math.abs(x1 - x0);
	var dy = Math.abs(y1 - y0);
	var sx = (x0 < x1) ? 1 : -1;
	var sy = (y0 < y1) ? 1 : -1;
	var err = dx - dy;

	while(true) {

		set_pix(x0,y0, cur_col);

		if ((x0 === x1) && (y0 === y1)) break;
		var e2 = 2*err;
		if (e2 > -dy) { err -= dy; x0  += sx; }
		if (e2 < dx) { err += dx; y0  += sy; }
	}
}

function bresenham_circle(center_x, center_y, size, resolution){
	let pnts = new Array(resolution);
	let angle_step = TAU / resolution;

	//define the points
	for (let i=0; i<resolution; i++){
		let a = angle_step * i;
		pnts[i] = {
			x: center_x + cos(a) * size,
			y: center_y + sin(a) * size
		}
	}

	//connect 'em
	for (let i=0; i<resolution; i++){
		let p1 = pnts[i];
		let p2 = pnts[ (i+1)%resolution];
		bresenham_line(p1.x,p1.y, p2.x,p2.y);
	}

}




//grabs our small grid and blows it up to screen size
function grid2screen(){
	loadPixels();
	for (let c = 0; c < game_w; c++) {
		for (let r = 0; r < game_h; r++) {

			let col = grid[c][r];
			if (is_paused){
				col = pause_grid[c][r].c;
			}

			//set the full image
			for (let x=c*big_scale; x<(c+1)*big_scale; x++){
				for (let y=r*big_scale; y<(r+1)*big_scale; y++){
					let big_pos = (y*width + x) * 4;

					pixels[big_pos+0] = palette[col].levels[0];
					pixels[big_pos+1] = palette[col].levels[1];
					pixels[big_pos+2] = palette[col].levels[2];

				}		
			}
		}
	}

	updatePixels();
}