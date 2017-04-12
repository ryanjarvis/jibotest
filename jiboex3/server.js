const generate_squares = function(rows, cols) {
	let square_map = new Map();
	for(let row = 0; row < rows; row++) {
		for(let col = 0; col < cols; col++) {
			create_square_mapping([row,col], square_map, [rows, cols]);
		}
	}	
	return square_map;
};

const create_square_mapping = function(coords, square_map, size) {
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

	if( !is_valid_square( square_data.connected_to, size ) ) {
		square_data.connected_to = null;
		square_data.connected_to_home = true;
		return square_data;
	}

	let connection = create_square_mapping( square_data.connected_to, square_map, size );
	square_data.connected_to_home = connection.connected_to_home;
	return square_data;

};

const is_valid_square = function(coords, size) {
	let row = coords[0];
	let col = coords[1];
	if( (row < 0) ||
		(row >= size[0]) ||
		(col < 0) ||
		(col >= size[1]) ) {
		return false;
	}
	return true;
};

const Koa = require('koa');
const koa_route = require('koa-route');

const server = new Koa();

const get_random_board = async function(ctx, rows, cols) {
	let board = generate_squares(rows, cols);
	/*
	board.set(
		JSON.stringify([0,0]),
		{
			rotation: 1,
			connected_to: null,
			connected_to_home: true
		}
	);
	*/
	let spread = [...board];
	ctx.body = spread;
};

server.use(
	koa_route.get(
		'/api/v1/board/create/random/:rows/:cols',
		get_random_board
	)
);

server.use(
	async function(ctx) {
		ctx.body = "Jibo Test 3 server is running!"
	}
);

server.listen(8080);

