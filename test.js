var text = require("fs").readFileSync("./README.md","utf8")

text.replace(/(?=\n[^=]+\n)(?=\n[^ ]+\n)/g, function(){
    console.log(arguments);
});

/*
*
*
 hello i am kushal without and with = equal
 var ee=22;
 var 3 = 33;
 sfdf =dsfdsf





 dsfdsfgfdsgfg
 dsfsdgfsgf=sdfsd
 hdf skdvgfb dsfk vgdsf kdsf
 dfsgfgf=sdfvgdfsg



 var 22  ee

 dfsdf=sdfsdf

 sdfds

 sdfsdf=sdfs=sdfds=sdf=s

 * */