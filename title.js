let title_grid;

let title_img;
let instructions_img;
let cur_title_angle = 0;

let title_selector;

function setup_title(){
	title_grid = new Array(game_w);
	for (let x=0; x<game_w; x++){
		title_grid[x] = new Array(game_h);
		for (let y=0; y<game_h; y++){
			title_grid[x][y] = {
				c : 0,
				a : atan2(y-game_w/2, x-game_h/2),
				d : dist(x,y, game_w/2, game_h/2),
				v : 99999 
			}

			title_grid[x][y].v -= title_grid[x][y].d*0.1;
		}
	}

	title_img.loadPixels();
	instructions_img.loadPixels();
}

function draw_title(){

	pixel_effects_early();

	//go through and set based on the image
	cur_pause_angle += 0.2;
	if (cur_pause_angle >= PI)	cur_pause_angle -= TAU;
	let angle_dist_to_advance = PI;

	let p_cols = [12,12,12,13,10,10,10];
	
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			title_grid[x][y].c = 0;

			//small chance to toss in a colored pixel
			if (random(1) < 0.0005){
				title_grid[x][y].c = random(1) < 0.75 ? 6 : 2;
			}


			let index = ((y*game_w) + x) * 4;
			if (title_img.pixels[index] > 150){

				
				//let n2 = 99999 + title_grid[x][y].d*0.1 - frameCount*0.05;

				let ang_dist = Math.min( 
					abs(cur_pause_angle - title_grid[x][y].a),
					Math.min(abs(cur_pause_angle+TAU - title_grid[x][y].a),
						abs(cur_pause_angle-TAU - title_grid[x][y].a)
					)
				);

				if (ang_dist < angle_dist_to_advance){
					let prc = 1.0-ang_dist/angle_dist_to_advance;
					title_grid[x][y].v -= prc * 0.1;
				}

				let n1 = title_grid[x][y].a*0.41;
				let n2 = title_grid[x][y].v * 2;
				let col_index = noise(n1, n2) * p_cols.length;
				title_grid[x][y].c = p_cols[floor(col_index)];

				//the buttons along the bottom
				if (y > 70){
					if (x < 50){
						title_grid[x][y].c =  title_selector==0 ? 1 : 5;
					}else{
						title_grid[x][y].c =  title_selector==1 ? 1 : 5;
					}
				}
			}
		}
	}

	//move it to the real grid
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			if (title_grid[x][y].c != 0){
				//console.log(x+","+y+" "+title_grid[x][y].c)
				grid[x][y] = title_grid[x][y].c;
			}
		}
	}

	grid2screen();
}

function draw_instructions(){

	pixel_effects_early();
	
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			title_grid[x][y].c = 0;

			let index = ((y*game_w) + x) * 4;
			if (instructions_img.pixels[index] > 150){
				title_grid[x][y].c = 12;

			}
		}
	}

	//move it to the real grid
	for (let x=0; x<game_w; x++){
		for (let y=0; y<game_h; y++){
			if (title_grid[x][y].c != 0){
				//console.log(x+","+y+" "+title_grid[x][y].c)
				grid[x][y] = title_grid[x][y].c;
			}
		}
	}

	grid2screen();
}