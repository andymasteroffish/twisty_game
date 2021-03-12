//everybody seems to be getting an error when sound is played
//https://discourse.processing.org/t/error-when-playing-soundfile/23011/13

let mute = false;

let sounds = new Object;

let menu_music;
let game_music;
let tick_sound;

let music_vol_during_level_transition = 0.5;

let bar_prc_to_speed_up = 0.35;
let music_fast_rate = 1.25;

//load our sound files
function sound_preload(){

	sounds["beep"] = loadSound("audio/Blep.mp3");
	sounds["gem_get"] = loadSound("audio/GemGet2.mp3");
	sounds["jump"] = loadSound("audio/Invert.mp3");
	sounds["level_clear"] = loadSound("audio/Descending.mp3");
	sounds["killed"] = loadSound("audio/DroneOut.mp3");
	sounds["game_start"] = loadSound("audio/Fanfare1.mp3");

	tick_sound = loadSound("audio/click click click click.mp3");

	menu_music = loadSound("audio/Twisty Tunnels Theme Song.mp3");
	game_music = loadSound("audio/Twisty Tunnels Action Loop.mp3");

	
}

function sound_setup(){
	
	
	game_music.loop();
	game_music.pause();

	//menu_music.play();
	menu_music.loop();
	menu_music.pause();
	
}

function play_sfx(sfx_id){
	if (mute)	return;

	let sound = sounds[sfx_id];

	if(sound != null){

		if (sfx_id == "gem_get"){
			sound.rate( random(0.9,1.1));
		}

		sound.play();
	}
}

function start_menu_music(){
	if (mute)	return;

	//fade in the menu music
	let fade_in_time = 2;
	menu_music.setVolume(0);
	menu_music.play();
	menu_music.setVolume(1, fade_in_time);

	//fade out the drone
	if(sounds["killed"].isPlaying()){
		sounds["killed"].setVolume(0,1);
	}
}

function start_game_music(){
	if (mute)	return;


	play_sfx("game_start");
	

	menu_music.pause();

	let music_padding = 0.5;
	let music_start_time = sounds["game_start"].duration() - music_padding;

	game_music.setVolume(0)
	game_music.play(music_start_time);
	game_music.setVolume(1,music_padding,music_start_time);

	tick_sound.setVolume(0);
	tick_sound.loop();

	//make sure the kill sound is ready
	sounds["killed"].stop();
	sounds["killed"].setVolume(1);
}

function kill_player_sound_stuff(){
	tick_sound.stop();
	play_sfx("killed");
	game_music.pause();
}


function update_sound(){
	if (mute) return;

	//mess with the music speed when running low on time
	if (state == "game"){
		if ( life_timer/max_life_timer < bar_prc_to_speed_up){
			game_music.rate(music_fast_rate);
		}else{
			game_music.rate(1);
		}
	}

	//max player velocity is around 0.05
	if (state == "game" && !player.is_dead){

		let tick_volume = map( abs(player.angle_vel), 0, 0.03, 0, 1, true);
		let tick_speed = map( abs(player.angle_vel), 0.02, 0.05, 0.5, 1.75, true);
		//there are a bunch of reasons why we might not want to play the sound
		if ( !player.is_grounded || player.doing_flip_jump || doing_level_trans){
			tick_volume = 0;
		}
		tick_sound.setVolume(tick_volume);
		tick_sound.rate(tick_speed);
	}
}

function toggle_mute(){
	mute = !mute;

	if (mute){
		game_music.setVolume(0);
		menu_music.setVolume(0);
		tick_sound.setVolume(0);
	}
	else{
		game_music.setVolume(1);
		menu_music.setVolume(1);
	}

}

function on_mute(){
	
}