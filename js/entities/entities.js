var BirdEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('clumsy');
        settings.width = 85;
        settings.height = 60;
        settings.spritewidth = 85;
        settings.spriteheight= 60;

        this._super(me.Entity, 'init', [x, y, settings]);

        this.alwaysUpdate = true;
        this.body.gravity = 0.2;
        this.gravityForce = 0.01;
        
        // gravity inverted === 1
        this.gravityInverted = 0;
        this.gravityInvertFlag = 0;

        // constants for fast reference
        this.maxAngleRotationUp = -Math.PI/6; 
        this.maxAngleRotationDown = Math.PI/6;
        this.maxAngleRotationUpExtreme = -Math.PI/2;
        this.maxAngleRotationDownExtreme = Math.PI/2;
        this.gravityAngleGradient = Number.prototype.degToRad(0.5);

        this.renderable.addAnimation("flying", [0, 1, 2]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        
        // manually add a rectangular collision shape
        this.body.addShape(new me.Rect(5, 5, 70, 50));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.name = "clumsy";

    },

    update: function(dt) {
        // mechanics

        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        
        // trying to invert gravity
        if(me.input.isKeyPressed('invert_gravity') || this.gravityInvertFlag === 1) {
            
            if(this.gravityInverted === 0)  {
                this.gravityInverted = 1;
                this.gravityForce = -0.01;
                this.renderable.angle = 0;
            }
            else {
                this.gravityInverted = 0;
                this.gravityForce = 0.01;
                this.renderable.angle = 0;
            }

            this.renderable.flipY(this.gravityInverted === 1);
            this.gravityInvertFlag = 0;

        }

        //hardcoded this to avoid multiple comparisons and increase performance

        if(this.gravityInverted === 0) { //normal gravity
            if (me.input.isKeyPressed('fly')) {
                
                me.audio.play('wing');
                this.gravityForce = 0.02;
                var currentPos = this.pos.y;

                // stop the previous tweens
                this.flyTween.stop();
                this.flyTween.to({y: currentPos - 72 }, 50);
                this.flyTween.start();
                this.renderable.angle = this.maxAngleRotationUp;
            } else {
                //accelerate
                this.gravityForce += 0.2;

                //change position according to acceleration
                this.pos.y += me.timer.tick * this.gravityForce;
                //nose dive the player
                this.renderable.angle += this.gravityAngleGradient * this.gravityForce;
                //ensure player doesn't rotate
                if(this.renderable.angle > this.maxAngleRotationDownExtreme)
                    this.renderable.angle = this.maxAngleRotationDownExtreme;

            }
        } else { //inverted gravity
            if (me.input.isKeyPressed('fly')) {
                
                me.audio.play('wing');
                this.gravityForce = -0.02;
                var currentPos = this.pos.y;

                // stop the previous tweens
                this.flyTween.stop();
                this.flyTween.to({y: currentPos + 72}, 50);
                this.flyTween.start();
                this.renderable.angle = -this.maxAngleRotationDown;
            } else {
                //accelerate
                this.gravityForce -= 0.2;
                //change position according to acceleration
                this.pos.y += me.timer.tick * this.gravityForce;
                //nose dive the player
                this.renderable.angle -= this.gravityAngleGradient * this.gravityForce;
                //ensure player doesn't rotate
                if(this.renderable.angle > this.maxAngleRotationDownExtreme) // don't fuck with this
                    this.renderable.angle = this.maxAngleRotationDownExtreme; // you've been warned

            }
        }

        // var obj = me.game.world.collide(this);
       

        var hitSky = -100; // bird height + 20px //changed it to something else
        if (this.pos.y <= hitSky || this.collided) {
            game.data.start = false;
            me.audio.play("lose");
            this.endAnimation();
            return false;
        }
        me.collision.check(this);
        this.updateBounds();
        this._super(me.Entity, 'update', [dt]);

        return true;
    },

    onCollision: function(response) {
        
        var obj = response.b;

        if (obj.type === 'pipe' || obj.type === 'ground') {
                me.device.vibrate(500);
                this.collided = true;
            }
        
            // remove the hit box
            if (obj.type === 'hit') {
                me.game.world.removeChildNow(obj);
                game.data.steps++;
                me.audio.play('hit');
                this.pos.x = 60;
                if(obj.gravityInverter === true) { 
                    
                    // this.flyTween.stop();
                    // this.externallyInvertGravity();
                    // if(this.gravityInverted === 0) 
                    //     this.pos.y = obj.pos.y + 15;
                    // else
                    //     this.pos.y = obj.pos.y - 25;
                    // console.log("o " + obj.pos.y + " b " + this.pos.y);
                    // this.updateB ounds();
                    // me.state.pause(true);
                    this.gravityInvertFlag = 1;
                }
            }
                
    },

    endAnimation: function() {
        me.game.viewport.fadeOut("#fff", 100);
        var currentPos = this.renderable.pos.y;
        this.endTween = new me.Tween(this.renderable.pos);
        this.endTween.easing(me.Tween.Easing.Exponential.InOut);

        this.flyTween.stop();
        this.renderable.angle = this.maxAngleRotationDown;
        var finalPos = me.video.renderer.getHeight() - this.renderable.width/2 - 96;
        this.endTween
            .to({y: currentPos}, 1000)
            .to({y: finalPos}, 1000)
            .onComplete(function() {
                me.state.change(me.state.GAME_OVER);
            });
        this.endTween.start();
    },

    externallyInvertGravity: function() {

        if(this.gravityInverted === 0)  {
                this.gravityInverted = 1;
                this.gravityForce = -0.01;
                this.renderable.angle = 0;
            }
            else {
                this.gravityInverted = 0;
                this.gravityForce = 0.01;
                this.renderable.angle = 0;
            }

            this.renderable.flipY(this.gravityInverted === 1);
    },

});


var PipeEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe');
        settings.width = 148;
        settings.height= 1664;
        settings.spritewidth = 148;
        settings.spriteheight= 1664;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.addShape(new me.Rect(0 ,0, settings.width, settings.height));
        this.body.gravity = 0;
        this.body.vel.set(-5, 0);
        this.type = 'pipe';
    },

    update: function(dt) {
        // mechanics
        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        this.updateBounds();
        this._super(me.Entity, 'update', [dt]);
        return true;
    },

});

var PipeGenerator = me.Renderable.extend({
    init: function() {
        this._super(me.Renderable, 'init', [0, me.game.viewport.width, me.game.viewport.height]);
        this.alwaysUpdate = true;
        this.generate = 0;
        this.pipeFrequency = 92;
        this.pipeHoleSize = 1240;
        this.gravityInvertCounter = 1;
        this.gravityInvertFrequency = Math.round(Math.random()*10 +1);
        // console.log(" random number " + this.gravityInvertFrequency);
        this.posX = me.game.viewport.width;
        

    },

    update: function(dt) {
        // return;
        if ((this.generate++) === this.pipeFrequency) {
            this.generate = 0;
            var posY = Number.prototype.random(
                    me.video.renderer.getHeight() - 100,
                    200
            );
             var posY2 = posY - me.video.renderer.getHeight() - this.pipeHoleSize;
            // console.log("RH " + me.video.renderer.getHeight());
            var pipe1 = new me.pool.pull('pipe', this.posX, posY);
            var pipe2 = new me.pool.pull('pipe', this.posX, posY2);
            var hitPos = posY - 100;
            var hit;

            if ((this.gravityInvertCounter++) === this.gravityInvertFrequency) {

                this.gravityInvertCounter = 1;
                // this.gravityInvertFrequency = Math.round(Math.random()*10 +1);
                this.gravityInvertFrequency = Number.prototype.random(1,15);
                // console.log(" random number " + this.gravityInvertFrequency);
                
                hit = new me.pool.pull("hit", this.posX, hitPos,true); 

            } else  {
                hit = new me.pool.pull("hit", this.posX, hitPos,false);
            }

            pipe1.renderable.flipY(true);
            // var temp = (posY - this.pipeHoleSize);
            // console.log("p " + posY + "p2 " + temp);
            me.game.world.addChild(pipe1, 10);
            me.game.world.addChild(pipe2, 10);
            me.game.world.addChild(hit, 11);
        }


        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

var HitEntity = me.Entity.extend({
    init: function(x, y, inverter) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('hit');
        settings.width = 148;
        settings.height= 60;
        settings.spritewidth = 148;
        settings.spriteheight= 60;

        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.updateTime = false;
        this.renderable.alpha = 0;
        this.body.accel.set(-5, 0);
        this.body.addShape(new me.Rect(0, 0, settings.width - 30, settings.height - 30));
        this.type = 'hit';
        this.gravityInverter = inverter;

    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.accel);
        if (this.pos.x < -this.image.width) {
            me.game.world.removeChild(this);
        }
        this.updateBounds();
        this._super(me.Entity, "update", [dt]);
        return true;
    },

});

var Ground = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 96;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.body.addShape(new me.Rect(0 ,0, settings.width, settings.height));
        this.type = 'ground';
    },

    update: function(dt) {
        // mechanics
        this.pos.add(this.body.vel);
        if (this.pos.x < -this.renderable.width) {
            this.pos.x = me.video.renderer.getWidth() - 10;
        }
        this.updateBounds();
        return this._super(me.Entity, 'update', [dt]);
    },

});
