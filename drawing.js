let grid;

let palette = new Array(16);
let cur_col = 0;

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

				//figure out what the next color would be
				let next_col = 0;
				//ring colors
				if (c==1)	next_col = 2;
				if (c==2)	next_col = 3;
				if (c==3)	next_col = 7;
				if (c==7)	next_col = 0;
				//player colors
				if (c == 12)	next_col = 13;
				if (c == 13)	next_col = 14;
				if (c == 14)	next_col = 15;
				//gem colors
				if (c == 10)	next_col = 11;
				if (c == 11)	next_col = 14;

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
			if (y<game_h){

				// let c = grid[x][y];
				// if (c>0){
				// 	if(random(9)<1)	grid[x][y]=0;
				// 	grid[x-1+floor(random(3))][y-floor(random(2))] = (c+1)%7
				// 	if(random(9)<2 && c>1)	grid[x][y-3] = c
				// }
				// let c = grid[x][y];
				// if (c>1){
				// 	if(c!=2 || random(9)<1)	grid[x][y]=0;
				// 	grid[x-1+floor(random(3))][y-floor(random(2))] = (c+1)%7
				// 	if(random(9)<2 && c>1)	grid[x][y-3] = c
				// }




			// c=pget(x,y)
			// if c>1 then
			// 	if(c!=2 or r(9)<1)	p(x,y,0)
			// 	p( x-1+r(3), y-r(2), (c+1)%7)
			// 	if(r(9)<2 and c>1)	p(x,y-3,c)
			// end

				//glow on the ring
				// if (grid[x][y] == 0 && grid[x][y+1] == 1){
				// 	grid[x][y] = 3;
				// }
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

		grid[x0][y0] = cur_col;

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
	let demo_col = [0,0,0];
	for (let c = 0; c < game_w; c++) {
		for (let r = 0; r < game_h; r++) {

			let col = grid[c][r];

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