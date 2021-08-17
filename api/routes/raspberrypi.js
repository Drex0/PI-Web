const express = require('express');
const router = express.Router();
const fs = require('fs'); 

//const directoryPath = "//sldat30/scratch/pzachman/test/";
const directoryPath = "./control/"

// router.get('/', (req, res, next) => {
//     res.status(200).json({
//         message: 'Handling GET requests to /pis'
//     });
// });

router.post('/', (req, res, next) => { 
    //console.log(req.body.name);
    //console.log(req.body.action);
    //console.log(req.body.newname);

    switch(req.body.action){
        case "reload":{
            // Write reload file
            fs.writeFile(directoryPath+req.body.name, '', function (err) { 
                //handling error 
                if (err) { 
                    console.log('Unable to write reload file: ' + err);
                    return res.status(500).json({
                        message: 'Error writing reload file.'
                    });
                } else {
                    console.log('Reload file saved!'); 
                    return res.status(201).json({
                        message: 'Successfully created reload file.'
                    });
                }
            });
            break;
        }
        case "rename":{
            // Write rename file
            fs.writeFile(directoryPath+req.body.name+'.rename.'+req.body.newname, '', function (err) { 
                //handling error 
                if (err) { 
                    console.log('Unable to write rename file: ' + err); 
                    return res.status(500).json({
                        message: 'Error writing rename file.'
                    });                    
                } else {
                    console.log('Rename file saved!');
                    return res.status(201).json({
                        message: 'Successfully created rename file.'
                    });
                }
            });       
            break;     
        }
        default: {
            // Write reboot file
            fs.writeFile(directoryPath+req.body.name+'.reboot', '', function (err) { 
                //handling error 
                if (err) { 
                    console.log('Unable to write reboot file: ' + err); 
                    return res.status(500).json({
                        message: 'Error writing reboot file.'
                    });                    
                    //res.json({error : "Error writing reboot file.", status : 500});                    
                } else {
                    console.log('Reboot file saved!');
                    return res.status(201).json({
                        message: 'Successfully created reboot file!'
                    });
                }
            });
        }
    };
});

router.get('/:piName', (req, res, next) => {
    const piname = req.params.piName;

    res.status(200).json({
        message: 'The Pi Name is ',
        name: piname
    });
});

module.exports = router;

//https://www.youtube.com/watch?v=CMDsTMV2AgI&list=PL55RiY5tL51q4D-B63KBnygU6opNPFk_q&index=10