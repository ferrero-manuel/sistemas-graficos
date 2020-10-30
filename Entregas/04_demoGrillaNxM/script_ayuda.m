clear variables
close all
clc

rows = 25;
cols = 25;

i = [0 : 1 : rows-1];
j = [0 : 1 : cols];

u = 2*pi*i./rows;
phi = u;
v = pi*j./cols;
theta = v;

r = 1;

figure(1)
for count = phi(1:end-5)
    x = r*sin(theta)*cos(count);
    y = r*sin(theta)*sin(count);
    z = r*cos(theta);

    plot3(x,y,z,'o')
    hold on
endfor
