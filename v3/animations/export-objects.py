from FbxCommon import *
import math
import sys
import os
import json

TIME_MODES = 'default 120 100 60 50 48 30 30-drop ntsc-drop ntsc-full pal 24 1000 film custom 96 72 59-94'.split()

if __name__ == '__main__':
    filepath = sys.argv[1]
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

    print 'time mode:', TIME_MODES[time_mode]
    print 'frame range: %d - %d' % (frame_start, frame_end)

    animations = []

    # find the first camera node in the scene
    node_count = scene.GetNodeCount()
    for i in xrange( node_count ):
        node = scene.GetNode( i )
        attr = node.GetNodeAttribute()
        if isinstance( attr, FbxObject ):
            print 'Node Name:', node.GetName()

            time = FbxTime( 0 )
            anim = []

            for frame in xrange(frame_start, frame_end + 1):
                time.SetFrame( frame, time_mode )
                transform = node.EvaluateGlobalTransform( time )

                """M = []
                for i in xrange(4):
                    for j in xrange(4):
                        M.append(transform.Get(i, j))"""

                T = list( transform.GetT() ) ##[:3]
                #Q = list( transform.GetQ() )
                S = list( transform.GetS() )

                keyframe = {
                    'time': time.GetMilliSeconds(),
                    #'M': M,
                    'T': T,
                    'S': S,
                    #'Q': Q,
                    }
                anim.append( keyframe )

            data = {
                'name': node.GetName(),
                'frames': ( frame_end - frame_start ) + 1,
                'animation': anim
            }
            animations.append( data )

    filepath = '%s.js' % filepath #node.GetName()
    json.dump( animations, open(filepath, 'w') )
    print 'Total object count: ', node_count
    print 'Exported', filepath
