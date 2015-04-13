var BirdEntity = me.Entity.extend({
    init: function(x, y) {
        var settings = {};
        settings.image = me.loader.getImage('cat');
        settings.width = 85;
        settings.height = 60;
        settings.spritewidth = 68;
        settings.spriteheight= 42;

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

        this.renderable.addAnimation("flying", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        this.renderable.addAnimation("idle", [0]);
        this.renderable.setCurrentAnimation("flying");
        this.renderable.anchorPoint = new me.Vector2d(0.1, 0.5);
        
        // manually add a rectangular collision shape
        this.body.addShape(new me.Rect(5, 5,68, 42));

        // a tween object for the flying physic effect
        this.flyTween = new me.Tween(this.pos);
        this.flyTween.easing(me.Tween.Easing.Exponential.InOut);
        

        // end animation tween
        this.endTween = null;

        // collision shape
        this.collided = false;

        this.name = "clumsy";
        this.lol_count = 0;
        var that = this;
        this.flyTween.onUpdate(function() {            
            var ag =  that.gravityInverted === 0 ? that.renderable.angle + 30: -that.renderable.angle -30; 
            // for(i = -20; i <= 0; i += 5) {
                // me.game.world.addChild(new RainbowEntity(that.pos.x - 10 ,that.pos.y, ag));
            // }

        });

    },

    update: function(dt) {
        // mechanics

        if (!game.data.start) {
            return this._super(me.Entity, 'update', [dt]);
        }
        
        // trying to invert gravity
        // if(me.input.isKeyPressed('invert_gravity') || this.gravityInvertFlag === 1) {
            
        //     if(this.gravityInverted === 0)  {
        //         this.gravityInverted = 1;
        //         this.gravityForce = -0.01;
        //         this.renderable.angle = 0;
        //     }
        //     else {
        //         this.gravityInverted = 0;
        //         this.gravityForce = 0.01;
        //         this.renderable.angle = 0;
        //     }

        //     this.renderable.flipY(this.gravityInverted === 1);
        //     this.gravityInvertFlag = 0;

        // }

        //hardcoded this to avoid multiple comparisons and increase performance

        if(this.gravityInverted === 0) { //normal gravity
            if (me.input.isKeyPressed('fly')) {
                
                me.audio.play('wing');
                this.gravityForce = 0.02;
                var currentPos = this.pos.y;

                // stop the previous tweens
                this.flyTween.stop();
                this.flyTween.to({y: currentPos - 62 }, 100);
                

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
                this.flyTween.to({y: currentPos + 62}, 100);
                // this.flyTween.onUpdate(new function() {
                //       me.game.world.addChild(new RainbowEntity(this._object.pos.x - 10,this._object.pos.y));

                //     });
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

        
        me.game.world.addChild(new RainbowEntity(this.pos.x - 10,this.pos.y,
            this.gravityInverted === 0 ? this.renderable.angle : -this.renderable.angle));
       

        var hitSky = -100; // bird hardcodedeight + 20px //changed it to something else
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
        // if(obj.type === 'rainbow')
        //     return;
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
                    
                    this.flyTween.stop();
                    if(this.gravityInverted === 0)  {
                        this.gravityInverted = 1;
                        this.gravityForce = -0.005;
                        this.renderable.angle = 0;
                    }
                    else {
                        this.gravityInverted = 0;
                        this.gravityForce = 0.005;
                        this.renderable.angle = 0;
                    }

                    this.renderable.flipY(this.gravityInverted === 1);
                    
                    if(this.gravityInverted === 0) 
                        this.pos.y = obj.pos.y;
                    else
                        this.pos.y = obj.pos.y - 18;
                    console.log("o " + obj.pos.y + " b " + this.pos.y);
                    this.updateBounds();
                    // me.state.pause(true);
                    // this.gravityInvertFlag = 1;
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

        
    },

});


var PipeEntity = me.Entity.extend({
    init: function(x, y, pipe_no) {
        var settings = {};
        settings.image = this.image = me.loader.getImage('pipe1');
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
        this.gravityInvertFrequency =  Number.prototype.random(1,15);
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
            var pipe_no =  Number.prototype.random(0,3);
            var pipe1 = new me.pool.pull('pipe', this.posX, posY, pipe_no);
            var pipe2 = new me.pool.pull('pipe', this.posX, posY2, pipe_no);
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
        // settings.image = me.loader.getImage('ground');
        settings.width = 900;
        settings.height= 1;
        this._super(me.Entity, 'init', [x, y, settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-4, 0);
        this.body.addShape(new me.Rect(0 ,0, settings.width, settings.height));
        this.type = 'ground';
    },

    update: function(dt) {
        
        return this._super(me.Entity, 'update', [dt]);
    },

});

var RainbowEntity = me.Entity.extend({
    init: function(x,y,angle) {
        var settings = {};
        settings.image = me.loader.getImage('rainbow');
        settings.width = 20;
        settings.height = 36;
        this._super(me.Entity,'init',[x,y,settings]);
        this.alwaysUpdate = true;
        this.body.gravity = 0;
        this.body.vel.set(-6,0);
        this.body.addShape(new me.Rect(0,0,settings.width,settings.height));
        this.renderable.angle = angle;
        this.body.collisionType = me.collision.types.NO_OBJECT;
        this.type = 'rainbow';

    },

    update: function(dt) {
        this.pos.add(this.body.vel);
        if(this.pos.x < -this.renderable.width) {
            me.game.world.removeChild(this);
        }
        this.updateBounds();
        return this._super(me.Entity, 'update', [dt]);

    },
});
