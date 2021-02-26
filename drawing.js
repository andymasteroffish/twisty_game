
//https://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
function bresenham_line(x0, y0, x1, y1, fbo) {
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
		fbo.point(x0, y0); // Do what you need to for this

		if ((x0 === x1) && (y0 === y1)) break;
		var e2 = 2*err;
		if (e2 > -dy) { err -= dy; x0  += sx; }
		if (e2 < dx) { err += dx; y0  += sy; }
	}
}

function bresenham_circle(center_x, center_y, size, resolution, fbo){
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
		bresenham_line(p1.x,p1.y, p2.x,p2.y, fbo);
	}

}