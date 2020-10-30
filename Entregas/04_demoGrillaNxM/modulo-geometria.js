

/*

    Tareas:
    ------

    1) Modificar a función "generarSuperficie" para que tenga en cuenta los parametros filas y columnas al llenar el indexBuffer
       Con esta modificación deberían poder generarse planos de N filas por M columnas

    2) Modificar la funcion "dibujarMalla" para que use la primitiva "triangle_strip"

    3) Crear nuevos tipos funciones constructoras de superficies

        3a) Crear la función constructora "Esfera" que reciba como parámetro el radio

        3b) Crear la función constructora "TuboSenoidal" que reciba como parámetro la amplitud de onda, longitud de onda, radio del tubo y altura.
        (Ver imagenes JPG adjuntas)
        
        
    Entrega:
    -------

    - Agregar una variable global que permita elegir facilmente que tipo de primitiva se desea visualizar [plano,esfera,tubosenoidal]
    
*/


var superficie3D;
var mallaDeTriangulos;

var filas = 100;
var columnas = 100;


function crearGeometria() {
    // superficie3D=new Plano(3, 3);
    // superficie3D = new Esfera(2);
    superficie3D = new TuboSenoidal(0.2, 0.2, 1, 2);

    mallaDeTriangulos = generarSuperficie(superficie3D, filas, columnas);
}

function dibujarGeometria() {
    dibujarMalla(mallaDeTriangulos);
}

function Plano(ancho, largo) {
    this.getPosicion = function(u, v) {
        var x = (u - 0.5)*ancho;
        var z = (v - 0.5)*largo;

        return [x,0,z];
    }

    this.getNormal = function (u, v) {
        return [0,1,0];
    }

    this.getCoordenadasTextura = function(u, v) {
        return [u,v];
    }
}

function Esfera(radio){
    this.getPosicion = function(u, v) {
        var phi = 2*Math.PI*u;
        var theta = Math.PI*v;

        var x = radio*Math.sin(theta)*Math.sin(phi);
        var y = radio*Math.cos(theta);
        var z = radio*Math.sin(theta)*Math.cos(phi);

        return [x,y,z];
    }

    this.getNormal = function(u, v) {
        var phi = 2*Math.PI*u;
        var theta = Math.PI*v;

        var theta_sin = Math.sin(theta);
        var theta_cos = Math.cos(theta);
        var phi_sin = Math.sin(phi);
        var phi_cos = Math.cos(phi);
        
        var r2 = radio*radio;
        var nx = r2*theta_sin*theta_sin*phi_sin;
        var ny = r2*(theta_sin*theta_cos*phi_cos*phi_cos + theta_sin*theta_cos*phi_sin*phi_sin);
        var nz = r2*theta_sin*theta_sin*phi_cos;

        var nmod = Math.sqrt(nx*nx + ny*ny + nz*nz);

        return [(nx/nmod),(ny/nmod),(nz/nmod)];
    }

    this.getCoordenadasTextura = function(u, v) {
        return [u,v];
    }
}

function TuboSenoidal(amplitud, lambda, radio, altura) {
    this.getPosicion = function(u, v) {
        var phi = 2*Math.PI*u;
        var k = 2*Math.PI/lambda;

        var wave = amplitud*Math.cos(k*v)

        var x = (radio + wave)*Math.sin(phi);
        var y = (v - 0.5)*altura;
        var z = (radio + wave)*Math.cos(phi);

        return [x,y,z];
    }

    this.getNormal = function (u, v) {
        return [0,1,0];
    }

    this.getCoordenadasTextura = function(u, v) {
        return [u,v];
    }
}

function generarSuperficie(superficie, filas, columnas){
    positionBuffer = [];
    normalBuffer = [];
    uvBuffer = [];

    for (var i = 0; i <= filas; i++) {
        for (var j = 0; j <= columnas; j++) {

            var u = j/columnas;
            var v = i/filas;

            var pos = superficie.getPosicion(u, v);

            positionBuffer.push(pos[0]);
            positionBuffer.push(pos[1]);
            positionBuffer.push(pos[2]);

            var nrm = superficie.getNormal(u, v);

            normalBuffer.push(nrm[0]);
            normalBuffer.push(nrm[1]);
            normalBuffer.push(nrm[2]);

            var uvs = superficie.getCoordenadasTextura(u, v);

            uvBuffer.push(uvs[0]);
            uvBuffer.push(uvs[1]);
        }
    }

    // Buffer de indices de los triángulos
    
    indexBuffer=[];  

    for (i = 0; i < filas; i++) {
        indexBuffer.push(i*(columnas+1));

        for (var j = 0; j <= columnas; j++) {
            indexBuffer.push(i*(columnas+1)+j);
            indexBuffer.push((i+1)*(columnas+1)+j);            
        }
        indexBuffer.push((i+1)*(columnas+1)+columnas);
    }

    // Creación e Inicialización de los buffers

    webgl_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);
    webgl_position_buffer.itemSize = 3;
    webgl_position_buffer.numItems = positionBuffer.length / 3;

    webgl_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
    webgl_normal_buffer.itemSize = 3;
    webgl_normal_buffer.numItems = normalBuffer.length / 3;

    webgl_uvs_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uvs_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvBuffer), gl.STATIC_DRAW);
    webgl_uvs_buffer.itemSize = 2;
    webgl_uvs_buffer.numItems = uvBuffer.length / 2;


    webgl_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
    webgl_index_buffer.itemSize = 1;
    webgl_index_buffer.numItems = indexBuffer.length;

    return {
        webgl_position_buffer,
        webgl_normal_buffer,
        webgl_uvs_buffer,
        webgl_index_buffer
    }
}

function dibujarMalla(mallaDeTriangulos){
    
    // Se configuran los buffers que alimentaron el pipeline
    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_position_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mallaDeTriangulos.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_uvs_buffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mallaDeTriangulos.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_normal_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mallaDeTriangulos.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
       
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mallaDeTriangulos.webgl_index_buffer);


    if (modo != "wireframe") {
        gl.uniform1i(shaderProgram.useLightingUniform, (lighting == "true"));                    
        /*
            Aqui es necesario modificar la primitiva por triangle_strip
        */
        gl.drawElements(gl.TRIANGLE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    
    if (modo != "smooth") {
        gl.uniform1i(shaderProgram.useLightingUniform, false);
        gl.drawElements(gl.LINE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
 
}

