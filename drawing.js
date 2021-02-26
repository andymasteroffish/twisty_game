let grid;

let palette = new Array(4);
let cur_col = 0;

function setup_drawing(){
	palette[0] = [0,0,0];
	palette[1] = [255,255,255];
	palette[2] = [100,100,255];
	palette[3] = [255,150,150];
}

function clear_grid() {
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			grid[x][y] = 0;
		}
	}
}

function pixel_effects() {
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			if (y<game_h){
				if (grid[x][y] == 0 && grid[x][y+1] == 1){
					grid[x][y] = 3;
				}
			}
			
		}
	}
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