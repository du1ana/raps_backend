const router = require('express').Router();
let Accident = require('../../models/accident.model');
let PoliceSession = require('../../models/policeSession.model');

//Predictor calculation functions
function getHourCat(datetime){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const h= d.getHours();
    if(h<5 || h>20){
        return 0; //free of charge
    }else if(h<9 || h>15){
        return 1; //rush
    }else
        return 2;//normal
}

function getDayCat(datetime){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const h= d.getDay();
    //check public holiday? return 2
    if(h==0||h==6){
        return 1; //weekend
    }else
        return 0;//weekday
}

function getMonthCat(datetime){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const m= d.getMonth();
    //check public holiday? return 2
    if(m<2||m>8){
        return true; //offpeak
    }else
        return false;//peak
}

function getVision(datetime,weather){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const t= d.getHours()*60+d.getMinutes;
    if(t<330||t>=1140){
        return 0; //poor
    }else if(t<420||t>=1050){
        return 1; //glare
    }else if(weather==true){
        return 3; //blurred
    }else{
        return 2; //normal
    }
}

function getAgeCat(age){
    if(!age){
      return null;
    }
    if(age<30){
        return 0; //young
    }else if(h<50){
        return 1; //mid
    }else
        return 2;//old
}

function getKmCat(kmPost){
    if(!kmPost){
      return null;
    }
    if(kmPost<26){
        return 0; //km1
    }else if(kmPost<51){
        return 1; //km2
    }else if(kmPost<76){
        return 2; //km3
    }else if(kmPost<101){
        return 3; //km4
    }else{
        return 5; //km6
    }
}

function getDrowsiness(datetime){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const t= d.getHours()*60+d.getMinutes;
    if(t>=480 && t<600 || t>=840 && t<960 || t>=1260 || t<300){
        return true;
    }else{
        return false;
    }
}

function getAnimalCrossing(datetime,weather){
    if(!datetime){
      return null;
    }
    const d=new Date(datetime);
    const t= d.getHours()*60+d.getMinutes;
    //logic should be implemened
    return false;
}

function getEnoughGap(reason){
    if(reason==3){
        return false;
    }else{
        return true;
    }
}

//Submit (post request)
router.route('/submit').post((req, res) => {
  const { body } = req;
  const {
    datetime,
    driverAge,
    driverGender,
    weather ,
    roadSurface,
    vehicleType ,
    vehicleYOM  ,
    licenseIssueDate,
    drivingSide ,
    severity ,
    reason ,
    kmPost  ,
    suburb,
    operatedSpeed,
    vehicle_condition,
    sessionToken
} = body;
  //Data constraints
  if(!datetime){
      return res.send({
          success:false,
          message:'Error: Date/Time invalid.'
      })}
    if(!sessionToken|| sessionToken.length!=24){
        return res.send({
            success:false,
            message:'Error: Session Token invalid.'
        })}
    //validating session
    PoliceSession.find({   
        _id:sessionToken, 
        isDeleted:false
    }, (err,sessions) =>{
        if(err){
            return res.send({
                success:false,
                message:'Error:Server error or Session not found'
            })
        }
        if(sessions.length!=1){
            return res.send({
                success:false,
                message:'Error:Invalid Session'
            })
        }else{
                //save to database
                const  newAccident = new Accident();
                 newAccident.datetime = datetime;
                 newAccident.driverAge = driverAge;
                 newAccident.driverGender = driverGender;
                 newAccident.weather = weather;
                 newAccident.roadSurface=roadSurface;
                 newAccident.vehicleType = vehicleType;
                 newAccident.vehicleYOM = vehicleYOM;
                 newAccident.licenseIssueDate = licenseIssueDate;
                 newAccident.drivingSide = drivingSide;
                 newAccident.severity = severity;
                 newAccident.reason = reason;
                 newAccident.kmPost = kmPost;
                 newAccident.suburb = suburb;
                 newAccident.operatedSpeed = operatedSpeed;
                 newAccident.vehicle_condition=vehicle_condition;
                 newAccident.status = 0;
                 newAccident.isDeleted = false;           
                 newAccident.sessionToken = sessionToken;
                 newAccident.day_cat = getDayCat(datetime);
                 newAccident.hour_cat = getHourCat(datetime);
                 newAccident.month_cat = getMonthCat(datetime);
                 newAccident.vision = getVision(datetime,weather);
                 newAccident.age_cat = getAgeCat(driverAge);
                 newAccident.km_cat = getKmCat(kmPost);
                 newAccident.drowsiness = getDrowsiness(datetime);
                 newAccident.enough_gap = getEnoughGap(reason);
                 newAccident.animal_crossing_problem=getAnimalCrossing(datetime,weather);
                 newAccident.save()
                .then(() => 
                    res.send({
                    success:true,
                    message:'Accident submitted successfully.',
                    data:newAccident
                })
                )
                .catch(err => res.send({
                    success:false,
                    message:'Error:Data Validation Error'
                })
                )

            }
        }
        )
    });



//List All Accidents
router.route('/list').get((req,res) => {
    Accident.find({   
        isDeleted:false
        }, (err,accidentList) =>{
            if(err){
                return res.send({
                    success:false,
                    message:'Error:Server error'
                })
            }else{
                let data=[];
                for(i in accidentList){
                   data.push({
                        'id':accidentList[i]._id,
                        'datetime':accidentList[i].datetime, 
                        'driverAge':accidentList[i].driverAge,
                        'driverGender':accidentList[i].driverGender,
                        'weather':accidentList[i].weather,
                        'roadSurface':accidentList[i].roadSurface,
                        'vehicleType':accidentList[i].vehicleType,
                        'vehicleYOM':accidentList[i].vehicleYOM,
                        'licenseIssueDate':accidentList[i].licenseIssueDate,
                        'drivingSide':accidentList[i].drivingSide,
                        'severity':accidentList[i].severity,
                        'reason':accidentList[i].reason,
                        'kmPost':accidentList[i].kmPost,
                        'suburb':accidentList[i].suburb,
                        'operatedSpeed':accidentList[i].operatedSpeed,
                        'vehicle_condition':accidentList[i].vehicle_condition,
                        'status':accidentList[i].status,
                        'day_cat':accidentList[i].day_cat,
                        'hour_cat':accidentList[i].hour_cat,
                        'month_cat':accidentList[i].month_cat,
                        'vision':accidentList[i].vision,
                        'age_cat':accidentList[i].age_cat,
                        'km_cat':accidentList[i].km_cat,
                        'drowsiness':accidentList[i].drowsiness,
                        'enough_gap':accidentList[i].enough_gap,
                        'animal_crossing_problem':accidentList[i].animal_crossing_problem
                })
                }

                return res.send({
                    success:true,
                    message:'List received',
                    data:data
                })
            }
})
})

//Deleting an accident
router.route('/delete').delete((req, res) => {
    const { body } = req;
    const {id, sessionToken} = body; //id of accident to be deleted, session token of police user 
        //Data constraints
    if(!id || id.length!=24){
        return res.send({
            success:false,
            message:'Error: Accident invalid.'
        })}
      if(!sessionToken|| sessionToken.length!=24){
          return res.send({
              success:false,
              message:'Error: Session Token invalid.'
          })}
      //validating session
      PoliceSession.find({   
          _id:sessionToken, 
          isDeleted:false
      }, (err,sessions) =>{
          if(err){
              return res.send({
                  success:false,
                  message:'Error:Server error or Session not found'
              })
          }
          if(sessions.length!=1 || sessions[0].isDeleted){
              return res.send({
                  success:false,
                  message:'Error:Invalid Session'
              })
          }else{
              //validating accident deletion
              Accident.findOneAndDelete({
                _id: id
            }, function (err, docs) { 
                if (err){ 
                    return res.send({
                        success:false,
                        message:'Error:Server error'
                    })
                } 
                else{ 
                    return res.send({
                        success:true,
                        message:'Accident deleted'
                    })
                } 
            })
              
                  }
              }) 
      });

  

module.exports = router;