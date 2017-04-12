(function() {
// **APPLICATION**
class App {

	public: ViewModel;
	scene: any = null;
	constructor() {
		this.public = new ViewModel();
		this.public.api.build_board = this.build_board,
		this.public.api.start_path_traversal = this.start_path_traversal,
		this.public.api.stop_path_traversal = this.stop_path_traversal,
		this.public.api.reset = this.reset
	}

	init() {
		window.vm = new Vue(
			{
				el: "#mainview",
				data: this.public.data,
				methods: this.public.api
			}
		);
	}

	generate_squares() {
		this.clear_squares();
		for(let row = 0; row < this.public.data.desired_rows; row++) {
			for(let col = 0; col < this.public.data.desired_cols; col++) {
				this.create_square_mapping([row,col]);
			}
		}	
	}

	clear_squares() {
		this.public.data.squares.clear();
	}

	create_square_mapping(coords: Array<number>) {
		let square_map = this.public.data.squares;
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

		if( !this.is_valid_square( square_data.connected_to ) ) {
			square_data.connected_to = null;
			square_data.connected_to_home = true;
			return square_data;
		}

		let connection = this.create_square_mapping( square_data.connected_to );
		square_data.connected_to_home = connection.connected_to_home;
		return square_data;

	}

	is_valid_square(coords: Array<number>) {
		let row = coords[0];
		let col = coords[1];
		if( (row < 0) ||
			(row >= this.public.data.desired_rows) ||
			(col < 0) ||
			(col >= this.public.data.desired_cols) ) {
			return false;
		}
		return true;
	}

	generate_scene() {
		this.clear_scene();
		this.scene = new PIXI.Application(
			this.public.data.desired_cols * 50,
			this.public.data.desired_rows * 50,
			{backgroundColor: 0xFFFFFF}
		);
		document.querySelector("#canvastest").appendChild(this.scene.view);

		this.public.data.checker.sprite = PIXI.Sprite.fromImage( 'checker.png' );
		let checker_sprite = this.public.data.checker.sprite
		checker_sprite.x = -50;
		checker_sprite.y = -50;

		for( let [square_key, square_data] of this.public.data.squares ) {
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
					this.public.data.start_square = square_data;
					this.public.data.current_square = square_data;
					this.public.data.next_square = this.public.data.squares.get( JSON.stringify( square_data.connected_to ) );
				}
			);

			this.scene.stage.addChild( sprite );
		};

		this.scene.stage.addChild( checker_sprite );

		this.scene.ticker.add(
			function(delta) {
				if(this.public.data.traversing_path) {
					let current_square = this.public.data.current_square;
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

					let next_square = this.public.data.next_square;
					if( next_square === undefined ) {
						return
					}

					if( checker_sprite.x === next_square.sprite.x &&
						checker_sprite.y === next_square.sprite.y ) {
						this.public.data.current_square = next_square;
						this.public.data.next_square = this.public.data.squares.get( JSON.stringify( this.public.data.current_square.connected_to ) );
						checker_sprite.rotation = this.public.data.current_square.sprite.rotation;
					}

				}
			}
		);
	}

	clear_scene() {
		this.public.api.stop_path_traversal();
		if( this.scene ) { this.scene.destroy(true); }
		this.public.data.start_square = null;
		this.public.data.current_square = null;
		this.public.data.next_square = null;
	}

	build_board() {
		this.public.data.board_loaded = false;
		this.generate_squares();
		this.generate_scene();
		this.public.data.board_loaded = true;
	}

	start_path_traversal() {
		this.public.data.traversing_path = true;
	}
	stop_path_traversal() {
		this.public.data.traversing_path = false;
	}

	reset() {
		if( this.public.data.start_square === null ) {
			return
		}

		this.public.data.current_square = this.public.data.start_square;
		this.public.data.next_square = this.public.data.squares.get( JSON.stringify( this.public.data.current_square.connected_to ) );
		this.public.data.checker.sprite.x = this.public.data.current_square.sprite.x;
		this.public.data.checker.sprite.y = this.public.data.current_square.sprite.y;
		this.public.data.checker.sprite.rotation = this.public.data.current_square.sprite.rotation;
	}

}

class ViewModel {
	data: VMData;
	api: VMApi;
	constructor() {
		this.data = new VMData;
		this.api = new VMApi;
	}
}

class VMData {
	desired_rows: number = 10;
	desired_cols: number = 10;
	checker: any = {};
	squares: Map<string,any> = new Map();
	board_loaded: boolean = false;
	start_square: any = null;
	current_square: any = null;
	next_square: any = null;
	traversing_path: boolean = false;
	constructor() {}
}

class VMApi {
	build_board: () => void;
	start_path_traversal: () => void;
	stop_path_traversal: () => void;
	reset: () => void;
	constructor() {}
}

const app = new App();

// **DATA BINDING**
window.vm = null;

// **SCRIPT LOADING**
window.onload = app.init

})();
