PX.Shaders = { 

    GradSphereVertex: [
	"// GradSphere Vertex",
    "varying vec2 texcoord;",
	"void main()",
	"{",
	"	texcoord = uv;",
	"	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
	"}" ].join("\n")


    , GradSphereFragment: [
	"// GradSphere Fragment",
	"varying vec2 texcoord;",
	"uniform float Time;",
	"// x is length",
	"// y is normalized y pos on texture",
	"uniform vec4 GradParams;",
	"uniform vec3 Color1;",
	"uniform vec3 Color2;",
	"void main()",
	"{",
	"    float v1 = GradParams.y - GradParams.x;",
	"    float v2 = GradParams.y + GradParams.x;",
	"    float per = texcoord.y;",
	"    vec4 finalColor = vec4( 0.0, 0.0, 0.0, 1.0 );",
	"    ///finalColor.rgb = Color1 * step( v1, per );",
	"    //finalColor.rgb = mix( finalColor.rgb, Color2 * step( v2, per ), per );",
	"    //finalColor.rgb = mix( finalColor.rgb, Color2, smoothstep( v1, v2, per ) );",
	"    if( per <= v1 )   finalColor.rgb = Color1;",
	"    else if( per >= v2 )    finalColor.rgb = Color2;",
	"    else  finalColor.rgb = mix( Color1, Color2, smoothstep( v1, v2, per ) );",
	"    gl_FragColor = finalColor;",
	"}" ].join("\n")


    , DefaultTextureUnPremultiplyFragment: [
	"// DefaultTextureUnPremultiplyFragment",
	"varying vec2 texcoord;",
	"uniform sampler2D DiffuseMap;",
	"uniform float Alpha;",
	"void main()",
	"{",
	"	vec4 color = texture2D( DiffuseMap, texcoord );",
	"	float a = color.a * Alpha;",
	"	gl_FragColor = vec4( color.rgb / a, a );",
	"}" ].join("\n")


    , DefaultTextureFragment: [
	"// DefaultTexture",
	"varying vec2 texcoord;",
	"uniform sampler2D DiffuseMap;",
	"void main()",
	"{",
    "    gl_FragColor = texture2D( DiffuseMap, texcoord );",
	"}" ].join("\n")

}