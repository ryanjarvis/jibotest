(function() {
// **APPLICATION**
const app = Object.create(null);

app.init = function() {
	window.vm = new Vue(
		{
			el: "#mainview",
			data: app.public.data,
			methods: app.public.api
		}
	);
}

app.generate_squares = function() {
	app.clear_squares();
	for(let row = 0; row < app.public.data.desired_rows; row++) {
		for(let col = 0; col < app.public.data.desired_cols; col++) {
			app.create_square_mapping([row,col]);
		}
	}	
};

app.clear_squares = function() {
	app.public.data.squares.clear();
}

app.create_square_mapping = function(coords) {
	let square_map = app.public.data.squares;
	let square_key = JSON.stringify( coords );
	if( square_map.has( square_key ) ) {
		return square_map.get( square_key )
	}

	let square_data = {
		rotation: 0, //this is an abbreviation for the 4 cardinal directions.  0 = N, 1 = W, 2 = S, 3 = E
		connected_to: null,
		connected_to_home: false
	};
	square_map.set( square_key, square_data );

	//determine random connection
	//note: we are going to cache the orientation
	//the cell uses to face its neighbor to save rendering time
	let x_axis = Math.random() >= 0.5;
	let modifier = Math.random() >= 0.5 ? -1 : 1;
	if( x_axis ) {
		square_data.connected_to = [coords[0] + modifier, coords[1]];
		square_data.rotation = 1 + modifier;
	} else {
		square_data.connected_to = [coords[0], coords[1] + modifier];
		square_data.rotation = 2 + modifier;
	}

	if( !app.is_valid_square( square_data.connected_to ) ) {
		square_data.connected_to = null;
		square_data.connected_to_home = true;
		return square_data;
	}

	let connection = app.create_square_mapping( square_data.connected_to );
	square_data.connected_to_home = connection.connected_to_home;
	return square_data;

};

app.is_valid_square = function(coords) {
	let row = coords[0];
	let col = coords[1];
	if( (row < 0) ||
		(row >= app.public.data.desired_rows) ||
		(col < 0) ||
		(col >= app.public.data.desired_cols) ) {
		return false;
	}
	return true;
};

app.generate_scene = function() {
	app.clear_scene();
	app.scene = new PIXI.Application(
		app.public.data.desired_cols * 50,
		app.public.data.desired_rows * 50,
		{backgroundColor: 0xFFFFFF}
	);
	document.querySelector("#canvastest").appendChild(app.scene.view);

	app.public.data.checker.sprite = PIXI.Sprite.fromImage( 'checker.png' );
	let checker_sprite = app.public.data.checker.sprite
	checker_sprite.x = -50;
	checker_sprite.y = -50;

	for( let [square_key, square_data] of app.public.data.squares ) {
		let coords = JSON.parse( square_key );
		if( square_data.connected_to_home ) {
			square_data.sprite = PIXI.Sprite.fromImage( 'arrow_connected.png' );
		} else {
			square_data.sprite = PIXI.Sprite.fromImage( 'arrow.png' );
		}
		let sprite = square_data.sprite;
		sprite.anchor.set(0.5);
		sprite.rotation = square_data.rotation * -90 * 0.0174533;
		sprite.x = coords[1] * 50 + 25;
		sprite.y = coords[0] * 50 + 25;

		sprite.interactive = true;
		sprite.on(
			'pointerdown',
			function() {
				checker_sprite.anchor.set(0.5);
				checker_sprite.rotation = sprite.rotation;
				checker_sprite.x = sprite.x;
				checker_sprite.y = sprite.y;
				app.public.data.start_square = square_data;
				app.public.data.current_square = square_data;
				app.public.data.next_square = app.public.data.squares.get( JSON.stringify( square_data.connected_to ) );
			}
		);

		app.scene.stage.addChild( sprite );
	};

	app.scene.stage.addChild( checker_sprite );

	app.scene.ticker.add(
		function(delta) {
			if(app.public.data.traversing_path) {
				let current_square = app.public.data.current_square;
				//this is ugly... replace with tweening
				if( current_square.rotation === 0 ) {
					checker_sprite.y = checker_sprite.y - 1;
				}
				if( current_square.rotation === 1 ) {
					checker_sprite.x = checker_sprite.x - 1;
				}
				if( current_square.rotation === 2 ) {
					checker_sprite.y = checker_sprite.y + 1;
				}
				if( current_square.rotation === 3 ) {
					checker_sprite.x = checker_sprite.x + 1;
				}

				let next_square = app.public.data.next_square;
				if( next_square === undefined ) {
					return
				}

				if( checker_sprite.x === next_square.sprite.x &&
					checker_sprite.y === next_square.sprite.y ) {
					app.public.data.current_square = next_square;
					app.public.data.next_square = app.public.data.squares.get( JSON.stringify( app.public.data.current_square.connected_to ) );
					checker_sprite.rotation = app.public.data.current_square.sprite.rotation;
				}

			}
		}
	);
};

app.clear_scene = function() {
	app.public.api.stop_path_traversal();
	if( app.scene ) { app.scene.destroy(true); }
	app.public.data.start_square = null;
	app.public.data.current_square = null;
	app.public.data.next_square = null;
}

app.build_board = function() {
	app.public.data.board_loaded = false;
	app.generate_squares();
	app.generate_scene();
	app.public.data.board_loaded = true;
};

app.start_path_traversal = function() {
	app.public.data.traversing_path = true;
};
app.stop_path_traversal = function() {
	app.public.data.traversing_path = false;
};

app.reset = function() {
	if( app.public.data.start_square === null ) {
		return
	}

	app.public.data.current_square = app.public.data.start_square;
	app.public.data.next_square = app.public.data.squares.get( JSON.stringify( app.public.data.current_square.connected_to ) );
	app.public.data.checker.sprite.x = app.public.data.current_square.sprite.x;
	app.public.data.checker.sprite.y = app.public.data.current_square.sprite.y;
	app.public.data.checker.sprite.rotation = app.public.data.current_square.sprite.rotation;
};

// expose data and methods for the HTML to interact with
// in a design pattern friendly to Vue.js
app.public = Object.create(null);
app.public.data = {
	desired_rows: 10,
	desired_cols: 10,
	checker: {},
	squares: new Map(),
	board_loaded: false,
	start_square: null,
	current_square: null,
	next_square: null,
	traversing_path: false
};
app.public.api = {
	build_board: app.build_board,
	start_path_traversal: app.start_path_traversal,
	stop_path_traversal: app.stop_path_traversal,
	reset: app.reset
};

// **DATA BINDING**
window.vm = null;

// **SCRIPT LOADING**
window.onload = app.init

})();
