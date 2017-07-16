from FbxCommon import *
import math
import sys
import os
import json

TIME_MODES = 'default 120 100 60 50 48 30 30-drop ntsc-drop ntsc-full pal 24 1000 film custom 96 72 59-94'.split()

if __name__ == '__main__':
    filepath = sys.argv[1]
    hasRotation = True
    if( len( sys.argv ) > 2 ):
        if( sys.argv[2] == "-norot" ): hasRotation = False

    sdk_manager, scene = InitializeSdkObjects()
    LoadScene(sdk_manager, scene, filepath)

    # timeline settings
    gs = scene.GetGlobalSettings()
    time_mode = gs.GetTimeMode()
    time_span = gs.GetTimelineDefaultTimeSpan()

    def time_to_frame(time):
        return int( time.GetFrameCountPrecise(time_mode) )

    frame_start = time_to_frame(time_span.GetStart())
    frame_end = time_to_frame(time_span.GetStop())
    step = 4

    print 'time mode:', TIME_MODES[time_mode]
    print 'frame range: %d - %d' % (frame_start, frame_end)

    animations = []
    numSavedAnims = 0

    # find the first camera node in the scene
    node_count = scene.GetNodeCount()
    for i in xrange( node_count ):
        node = scene.GetNode( i )
        attr = node.GetNodeAttribute()
        if isinstance( attr, FbxObject ):
            #print 'Node Name:', node.GetName()

            time = FbxTime( 0 )
            anim = []

            frame = 0
            for frame2 in xrange(frame_start, (frame_end/step) + 1):
                time.SetFrame( frame, time_mode )
                transform = node.EvaluateGlobalTransform( time )

                """M = []
                for i in xrange(4):
                    for j in xrange(4):
                        M.append(transform.Get(i, j))"""

                T = list( transform.GetT() )[:3]
                Q = list( transform.GetQ() )
                S = list( transform.GetS() )[:1]
                if S[0] < 0.001: S[0] = 0.001
                #if S[1] < 0.001: S[1] = 0.001
                #if S[2] < 0.001: S[2] = 0.001

                if math.isnan( Q[0] ):
                    Q[0] = 0.0
                if math.isnan( Q[1] ):
                    Q[1] = 0.0
                if math.isnan( Q[2] ):
                    Q[2] = 0.0
                if math.isnan( Q[3] ):
                    Q[3] = 1.0

                T[0] = float( "{0:.6f}".format( T[0] ) )
                T[1] = float( "{0:.6f}".format( T[1] ) )
                T[2] = float( "{0:.6f}".format( T[2] ) )
                Q[0] = float( "{0:.6f}".format( Q[0] ) )
                Q[1] = float( "{0:.6f}".format( Q[1] ) )
                Q[2] = float( "{0:.6f}".format( Q[2] ) )
                Q[3] = float( "{0:.6f}".format( Q[3] ) )
                S[0] = float( "{0:.6f}".format( S[0] ) )

                if( hasRotation ):
                    keyframe = {
                        't': time.GetMilliSeconds(),
                        #'M': M,
                        'T': T,
                        'S': S[0],
                        'Q': Q
                        }
                else:
                    keyframe = {
                        't': time.GetMilliSeconds(),
                        #'M': M,
                        'T': T,
                        'S': S[0]
                        }
                anim.append( keyframe )

                frame += step

            data = {
                'name': node.GetName(),
                'frames': ( (frame_end/step) - frame_start ) + 1,
                'anim': anim,
                'hasRotation': hasRotation
            }

            
            """framesDiff = 0

            # append animation data to the list
            # Only appen the ones with any kind of animation, otherwise skip it to save disk space
            oldt = anim[0]['T']
            olds = anim[0]['S']
            if( hasRotation ):
                oldq = anim[0]['Q']
            for frame in xrange( 1, len( anim ) ):
                t = anim[frame]['T']
                s = anim[frame]['S']
                if( hasRotation ):
                    q = anim[frame]['Q']

                incCounter = False

                # translate
                if oldt[0] != t[0]: incCounter = True
                if oldt[1] != t[1]: incCounter = True
                if oldt[2] != t[2]: incCounter = True

                # rotation
                if( hasRotation ):
                    if oldq[0] != q[0]: incCounter = True
                    if oldq[1] != q[1]: incCounter = True
                    if oldq[2] != q[2]: incCounter = True
                    if oldq[3] != q[3]: incCounter = True

                # scale
                if olds != s: incCounter = True
                #if olds[0] != s[0]: incCounter = True
                #if olds[1] != s[1]: incCounter = True
                #if olds[2] != s[2]: incCounter = True

                # 
                oldt = t
                olds = s
                if( hasRotation ):
                    oldq = q

                # Is any diff, increase frameDiff counter
                if incCounter == True:
                    framesDiff += 1

            #print framesDiff, " - ", (len(anim)-1)

            # If different frames are 0 then there is no animation at all. Skip it
            if framesDiff != 0:
                animations.append( data )
                numSavedAnims += 1
            #else:
                #print "no animation for", data['name']"""
            animations.append( data )

    filepath = '%s.js' % filepath #node.GetName()
    json.dump( animations, open(filepath, 'w') )
    print 'Total object count:', node_count, " +--+  Animated object count:", numSavedAnims+1
    print 'Exported', filepath
