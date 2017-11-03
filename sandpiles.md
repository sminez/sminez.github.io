---
title: sandpiles
galleries:
 1:
   -
     - { url: '/assets/sandpiles/22_img/H.png', alt: 'H', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_H_22.png'}
     - { url: '/assets/sandpiles/22_img/+o.png', alt: '+o, height: 150, width: 150', link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_+o_22.png'}
     - { url: '/assets/sandpiles/22_img/o-+.png', alt: 'o-+', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_+-o_22.png'}
     - { url: '/assets/sandpiles/22_img/o.png', alt: 'o', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_o_22.png'}
   -
     - { url: '/assets/sandpiles/22_img/o+.png', alt: 'o+', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_o+_22.png'}
     - { url: '/assets/sandpiles/22_img/o++.png', alt: 'o++', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_o++_22.png'}
     - { url: '/assets/sandpiles/22_img/o+++.png', alt: 'o+++', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_o+++_22.png'}
     - { url: '/assets/sandpiles/22_img/ox.png', alt: 'ox', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_ox_22.png'}
   -
     - { url: '/assets/sandpiles/22_img/::.png', alt: '::', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_::_22.png'}
     - { url: '/assets/sandpiles/22_img/+.png', alt: '+', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_+_22.png'}
     - { url: '/assets/sandpiles/22_img/++.png', alt: '++', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_++_22.png'}
     - { url: '/assets/sandpiles/22_img/xo.png', alt: 'xo', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_xo_22.png'}
   -
     - { url: '/assets/sandpiles/22_img/+x.png', alt: '+x', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_+x_22.png'}
     - { url: '/assets/sandpiles/22_img/x.png', alt: 'x', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_x_22.png'}
     - { url: '/assets/sandpiles/22_img/x+.png', alt: 'x+', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_x+_22.png'}
     - { url: '/assets/sandpiles/22_img/Y.png', alt: 'Y', height: 150, width: 150, link: 'https://raw.githubusercontent.com/sminez/recreational_mathematics/master/Sandpiles/images/highres/sandpile_Y_22.png'}

 2:
   -
     - { url: '/assets/sandpiles/gifs/:_4_22.gif', alt: ':', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/+_4-22.gif', alt: '+', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/++_4-22.gif', alt: '++', height: 150, width: 150}
   -
     - { url: '/assets/sandpiles/gifs/+o_4-22.gif', alt: '+o', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/o_4-22.gif', alt: 'o', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/o-+_4-22.gif', alt: 'o-+', height: 150, width: 150}
   -
     - { url: '/assets/sandpiles/gifs/o++_4-22.gif', alt: 'o++', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/o+++_4-22.gif', alt: 'o+++', height: 150, width: 150}
     - { url: '/assets/sandpiles/gifs/Y_4_22.gif', alt: 'Y', height: 150, width: 150}
---

# Sandpiles

Inspired by [Numberphile][0] I created a program to generate sandpile fractals
for different toppling patterns. The code can be found [here][1] on GitHub: it
generates a csv of the final pile heights which can then be visualised in a
number of different ways. The images below we created using a `heatmap` plot
from the Python Seaborn plotting library.


{% include gallery.html  gallery=1 %}


Below are some gifs of the evolution of the final state of 9 of the patterns as the
amount of starting sand is increased from 16 to 4194304 grains.


{% include gallery.html  gallery=2 %}


  [0]: https://www.youtube.com/watch?v=1MtEUErz7Gg
  [1]: https://github.com/sminez/recreational_mathematics/blob/master/Sandpiles/sandpile.go
  [2]: https://github.com/sminez/recreational_mathematics/tree/master/Sandpiles/images/highres
