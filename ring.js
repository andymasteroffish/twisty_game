const num_ring_steps = 100;
const ring_steps_2_radians = 6.283185/num_ring_steps;

function make_ring(){
	let ring = {
		dists: new Array(num_ring_steps)
	}

	//testing
	for (let i=0; i<num_ring_steps; i++){
		let prc = i / num_ring_steps;
		ring.dists[i] = (1.0-prc)*20 + prc*40;

		//ring.dists[i] = 30 + sin(i*0.4) * 3;

		// if (i<num_ring_steps/2){
		// 	ring.dists[i] = 20;
		// }else{
		// 	ring.dists[i] = 40;
		// }
	}

	return ring;
}

function draw_ring(ring, fbo) {
	fbo.noFill();
	fbo.stroke(255);
	fbo.strokeWeight(1);

	//fbo.beginShape();
	let pnts = new Array(num_ring_steps);

	for (let i=0; i<num_ring_steps; i++){
		let angle = i * ring_steps_2_radians + (-disp_angle + PI/2);
		let x = game_w/2 + cos(angle) * ring.dists[i];
		let y = game_h/2 + sin(angle) * ring.dists[i];
		//fbo.vertex(x,y);
		pnts[i] = {x:x, y:y};
	}
	//fbo.endShape(CLOSE);

	for (let i=0; i<num_ring_steps; i++){
		let next_pnt = pnts[ (i+1)%num_ring_steps ];
		bresenham_line( pnts[i].x, pnts[i].y, next_pnt.x, next_pnt.y, fbo);
	}

}