const router = require("express").Router();
const haversine = require("haversine");
const weatherData = require("../../helpers/weatherData");
let DriverSession = require("../../models/driverSession.model");
let EPoints = require("../../models/entrancePoints.model");
let RoadSession = require("../../models/roadSession.model");
let Vehicle = require("../../models/vehicle.model");

router.route("/nearEntrance").post((req, res) => {
  const token = req.body.token;
  const username = req.body.username;
  const selectedVehicle = req.body.regNo;

  DriverSession.find({ _id: token, isDeleted: false })
    .then((data) => {
      if (data.length !== 1 || data[0].isDeleted) {
        return res.json({ success: false, message: "Session error" });
      }
    })
    .catch((err) => {
      return res.json({ success: false, message: "Server error" });
    });

  EPoints.find({ type: "ep" })
    .then((points) => {
      const coords = {
        latitude: parseFloat(req.body.lat),
        longitude: parseFloat(req.body.lng),
      };
      let entranceCoords, distance;
      for (const pointIndex in points) {
        entranceCoords = {
          latitude: parseFloat(points[pointIndex].lat),
          longitude: parseFloat(points[pointIndex].lng),
        };
        distance = haversine(coords, entranceCoords, { unit: "meter" });

        if (distance < 500) {
          Vehicle.findOne({ username: username, regno: selectedVehicle })
            .then((vehicleDetails) => {
              weatherData(req.body.lat, req.body.lng)
                .then((weatherDetails) => {
                  newRoadSession = new RoadSession({
                    username: username,
                    isEnded: false,
                    vehicleDetails: {
                      type: vehicleDetails.type,
                      yom: vehicleDetails.yom,
                    },
                    weatherDetails: {
                      main: weatherDetails.main,
                      description: weatherDetails.description,
                    },
                  });

                  newRoadSession
                    .save()
                    .then(() => {
                      return res.json({
                        success: true,
                        message: points[pointIndex].entrance,
                      });
                    })
                    .catch((err) => {
                      return res.json({ success: false, message: err });
                    });
                })
                .catch((err) => {
                  return res.json({ success: false, message: err });
                });
            })
            .catch((err) => {
              return res.json({ success: false, message: err });
            });
        } else {
          return res.json({
            success: false,
            message: "Not near any entrances",
          });
        }
      }
    })
    .catch((err) => res.json("ERROR" + err));
});

router.route("/nearDanger").post((req, res) => {
  const username = req.body.username;

  RoadSession.findOne({ isEnded: false, username: username })
    .then((data) => {
      console.log({
        coords: {lat: req.body.lat, lng:req.body.lng},
        hour: new Date().getHours(),
        vehicleDetails: data.vehicleDetails,
        weatherDetails: data.weatherDetails,
      });
    })
    .catch((err) => {
      console.log(err);
    });

  EPoints.find({ type: { $in: ["dp", "exit"] } })
    .then((points) => {
      const dangerPoints = points.filter((item) => item.type === "dp");
      const exitPoints = points.filter((item) => item.type === "exit");
      const coords = {
        latitude: parseFloat(req.body.lat),
        longitude: parseFloat(req.body.lng),
      };
      let dangerCoords, exitCoords, distance;
      for (const pointIndex in dangerPoints) {
        dangerCoords = {
          latitude: parseFloat(dangerPoints[pointIndex].lat),
          longitude: parseFloat(dangerPoints[pointIndex].lng),
        };
        distance = haversine(coords, dangerCoords, { unit: "meter" });

        if (distance < 500) {
          return res.json({ status: 1, type: dangerPoints[pointIndex].dptype });
        }
      }

      for (const pointIndex in exitPoints) {
        exitCoords = {
          latitude: parseFloat(exitPoints[pointIndex].lat),
          longitude: parseFloat(exitPoints[pointIndex].lng),
        };
        distance = haversine(coords, exitCoords, { unit: "meter" });

        if (distance < 50) {
          return res.json({ status: -1 });
        }
      }
      return res.json({ status: 0 });
    })
    .catch((err) => res.json("ERROR" + err));
});

router.route("/recheckWeather").post((req, res) => {
  const username = req.body.username;
  console.log("UPDATING SESSION");
  RoadSession.findOne({
    username: username,
    isEnded: false,
  })
    .then((session) => {
      weatherData(req.body.lat, req.body.lng)
        .then((weatherDetails) => {
          session.weatherDetails = {
            main: weatherDetails.main,
            description: weatherDetails.description,
          };
          session
            .save()
            .then(() => {
              return res.json({ success: true, message: "Session updated" });
            })
            .catch((err) => {
              return res.json({ success: false, message: err });
            });
        })
        .catch((err) => {
          return res.json({ success: false, message: err });
        });
    })
    .catch((err) => {
      return res.json({ success: false, message: err });
    });
});

router.route("/endSession").post((req, res) => {
  const username = req.body.username;

  RoadSession.findOneAndUpdate(
    { username: username, isEnded: false },
    { isEnded: true }
  )
    .then(() => {
      return res.json({ success: true, message: "Road Session ended" });
    })
    .catch((err) => {
      return res.json({ success: false, message: err });
    });
});

router.route("/list").get((req, res) => {
  EPoints.find()
    .then((points) => res.json(points))
    .catch((err) => res.status(400).json("SERVER_ERROR"));
});

module.exports = router;
