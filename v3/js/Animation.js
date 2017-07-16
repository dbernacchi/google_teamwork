﻿
//
// All animation code used for keyframed animations on Teamwork
//

var KeyFrame = function ()
{
    this.position = null;
    this.scale = null;
//    this.orientation = null;
//    this.transform = null;
    this.time = 0.0;
};

var AnimatedInfo = function ()
{
    this.name = null;
    this.position = null;
    this.scale = null;
    this.orientation = null;
    this.isFinished = false;
};

var AnimationTrack = function ()
{
    this.name = null;
    this.lengthInMillis = 0.0;
    this.lengthInFrames = 0.0;
    this.keyframes = [];
};

AnimationTrack.prototype.Animate = function( time, animInfo, loop )
{
    var timeClamped = 0.0;

    // No loop mode
    if( time > this.lengthInMillis )
    {
        if( loop )
        {
            timeClamped = time % this.lengthInMillis;
        } 
        else
        {
            timeClamped = this.lengthInMillis;

            // Tells animation has reached the end.
            animInfo.isFinished = true;
            return;
        }
    }
    else
    {
        timeClamped = time;
        animInfo.isFinished = false;
    }

    var numOfKeys = this.keyframes.length;
    var key = 0;
    var key1 = 0;
    var key2 = 0;

    while (key < numOfKeys && this.keyframes[key].time < timeClamped) 
    {
        key++;
    }
    if( key < 0) key = 0;
    if( key >= numOfKeys ) key = numOfKeys - 1;
    key1 = key - 1;
    key2 = key;
    while (key1 < 0) {
        key1++;
        key2++;
    }
    //LOG( key + ", " + key1 + ", " + key2 );

    var keyframe1 = this.keyframes[key1];
    var keyframe2 = this.keyframes[key2];

    var beforeTiming = keyframe1.time;
    var afterTiming = keyframe2.time;
    var beforePos = keyframe1.position.clone();
    var afterPos = keyframe2.position.clone();
    var beforeScale = keyframe1.scale.clone();
    var afterScale = keyframe2.scale.clone();
    //var beforeQ = keyframe1.orientation.clone();
    //var afterQ = keyframe2.orientation.clone();

    // find interpolation t value
    var timeLength = (afterTiming - beforeTiming);
    var t = (timeClamped - beforeTiming) / timeLength;

    var tt = t;
    /*float tt = t*t;
     float ttt = tt*t;
     float dt = ttt*0 + tt*1 + t*1;*/
    //float dt = Quint.easeInOut( t, 0, 1, 1 );
    tt = Clamp( tt, 0.0, 1.0 );

    animInfo.position = beforePos.lerp( afterPos, tt );
    animInfo.scale = beforeScale.lerp( afterScale, tt );
    //    animInfo.orientation = beforeQ.slerp(afterQ, tt);

    animInfo.name = this.name;
    //LOG( "Orientation:  " + " time: " + t + " - " + animInfo.orientation.x + ", " + animInfo.orientation.y + ", " + animInfo.orientation.z + ", " + animInfo.orientation.w );
    //LOG( "Trans:  " + " time: " + t + " - " + animInfo.position.x + ", " + animInfo.position.y + ", " + animInfo.position.z );
};