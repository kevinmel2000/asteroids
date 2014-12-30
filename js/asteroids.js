  window.onload = function() {

		var game = new Phaser.Game(800, 600, Phaser.auto, 'asteroids', { preload: preload, create: create, update: update, render: render });

		function preload() {
			game.load.crossOrigin = "Anonymous"; 
			game.load.image('background', 'assets/images/background.jpg');
			game.load.image('stars', 'assets/images/stars.png');
			game.load.spritesheet('explosion', 'assets/images/explode.png', 128, 128);
			game.load.image('asteroid1', 'assets/images/asteroid1.png');
			game.load.image('asteroid2', 'assets/images/asteroid2.png');
			game.load.image('asteroid3', 'assets/images/asteroid3.png');
			game.load.image('bullet', 'assets/images/bullet.png');
			game.load.image('ship', 'assets/images/spaceship.png');

		}

		var ship;
		var background;
		var stars;
		var explosions;
		var asteroids;
		var NUMBER_OF_ASTEROIDS = 100;
		var bullets;
		var bulletTime = 0;
		var BULLET_SPEED = 800;
		var NUMBER_OF_BULLETS = 100;
		var SHOOT_DELAY = 50;
		var BULLET_LIFE_SPAN = 5000;
		var cursors;
		

		function create() {
			
			//world
			game.world.setBounds(0, 0, 2000, 2000);
			
			game.physics.startSystem(Phaser.Physics.P2JS);
			game.physics.p2.setImpactEvents(true);
			game.physics.p2.defaultRestitution = 0.2;

			//  Create our collision groups. One for the player, one for the asteroids
			var pCollision = game.physics.p2.createCollisionGroup();
			var aCollision = game.physics.p2.createCollisionGroup();
			var bCollision = game.physics.p2.createCollisionGroup();
			
			//  This part is vital if you want the objects with their own collision groups to still collide with the world bounds
			//  (which we do) - what this does is adjust the bounds to use its own collision group.
			game.physics.p2.updateBoundsCollisionGroup();
			
			//background			
			background = game.add.tileSprite(0, 0, 800, 600, 'background');
			background.fixedToCamera = true;
			
			//stars
			stars = game.add.tileSprite(0, 0, 800, 600, 'stars');
			stars.fixedToCamera = true;
			
			
			//  An explosion pool
			explosions = game.add.group();
			explosions.createMultiple(NUMBER_OF_ASTEROIDS, 'explosion');
			explosions.forEach(setupExplosion, this);
	
			
			//asteroids
			asteroids = game.add.group();
			asteroids.enableBody = true;
			asteroids.physicsBodyType = Phaser.Physics.P2JS;

			for (var i = 0; i < NUMBER_OF_ASTEROIDS; i++)
			{
				var rand = game.rnd.integerInRange(1,3);
				var asteroid = asteroids.create(game.world.randomX, game.world.randomY, "asteroid"+rand);
				game.physics.p2.enable(asteroid);
				asteroid.body.allowRotation = true;
				asteroid.body.collideWorldBounds = false;
				asteroid.body.setCircle(15);
				asteroid.body.setCollisionGroup(aCollision);
				asteroid.body.collides([aCollision, bCollision, pCollision]);
			}

			//bullets
			bullets = game.add.group();
			bullets.enableBody = true;
			bullets.physicsBodyType = Phaser.Physics.P2JS;
			
			for (var i = 0; i < NUMBER_OF_BULLETS; i++)
			{
				var bullet = bullets.create(0, 0, 'bullet');
				game.physics.p2.enable(bullet);
				bullet.body.collideWorldBounds = false;
				bullet.body.setCollisionGroup(bCollision);
				bullet.body.collides(aCollision, bulletCollision, this);
				bullet.kill();
			}
			
			
			//ship
			ship = game.add.sprite(1000, 1000, 'ship');
			game.physics.p2.enable(ship);
			ship.body.setCircle(16);
			ship.body.setCollisionGroup(pCollision);
			ship.body.collides(aCollision);
			ship.body.collideWorldBounds = false;
			
			//camera
			game.camera.follow(ship);
			
			//keys
			cursors = game.input.keyboard.createCursorKeys();

		}
		

		function setupExplosion(explosion) {
			explosion.anchor.x = 0.5;
			explosion.anchor.y = 0.5;
			explosion.animations.add('explosion');
		}

		function bulletCollision(body1, body2) {
		
			body1.sprite.kill();
			body2.sprite.kill();
			
			var explosion = explosions.getFirstExists(false);
			explosion.reset(body2.x, body2.y);
			explosion.play('explosion', 30, false, true);
	
		}

		function shoot()
		{
			if (game.time.now > bulletTime) {
				
				var bullet = bullets.getFirstExists(false);
				
				if(bullet){
				
					bullet.revive();
					bullet.reset(ship.x, ship.y);
					bullet.lifespan = BULLET_LIFE_SPAN;
					bullet.body.rotation = ship.body.rotation;
					bullet.rotation = ship.rotation - Phaser.Math.degToRad(90);
					bullet.body.velocity.x = Math.cos(bullet.rotation) * BULLET_SPEED + ship.body.velocity.x;
					bullet.body.velocity.y = Math.sin(bullet.rotation) * BULLET_SPEED + ship.body.velocity.y;
					bulletTime = game.time.now + SHOOT_DELAY; 
					
				}
			}
		}
		
		function update() {
		
			ship.body.setZeroRotation();
			if (cursors.left.isDown) {
				ship.body.rotateLeft(100);
			} else if (cursors.right.isDown) {
				ship.body.rotateRight(100);
			}

			if (cursors.up.isDown) {
				ship.body.thrust(200);
			} else if (cursors.down.isDown) {
				ship.body.reverse(200);
			}
			
			if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR))
			{
				shoot();
			}
	
			if (!game.camera.atLimit.x)
			{
				background.tilePosition.x -= (ship.body.velocity.x * 0.4) * game.time.physicsElapsed;
				stars.tilePosition.x -= (ship.body.velocity.x * 0.2) * game.time.physicsElapsed;
			}
			if (!game.camera.atLimit.y)
			{
				background.tilePosition.y -= (ship.body.velocity.y * 0.4) * game.time.physicsElapsed;
				stars.tilePosition.y -= (ship.body.velocity.y * 0.2) * game.time.physicsElapsed;
			}
			
			asteroids.forEachExists(screenWrap, this);
			bullets.forEachExists(screenWrap, this);
			game.world.wrap(ship.body);
			
			
		}
		
		function screenWrap (sprite) {
			game.world.wrap(sprite.body);
		}
		
		function render() {
			//game.debug.spriteInfo(ship, 32, 32);
			game.debug.text('Living Asteroids: ' + (asteroids.countLiving()), 32, 32);
		}

    };