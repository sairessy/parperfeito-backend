const Datastore = require("nedb");

const collections = {
  users: new Datastore("./src/database/users.db"),
  profilephotos: new Datastore("./src/database/profilephotos.db"),
}

collections.users.loadDatabase();
collections.profilephotos.loadDatabase();

const cors = require("cors");
const express = require("express");
const app = express();
app.use(express.json({limit: "2mb"}));

app.use(cors({
  origin: "*"
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PORT: ${PORT}`);
});


app.post("/signup", (req, res) => {
  const data = req.body;
  collections.users.insert(data, (err, doc) => {
    res.json({success: true});
  });
});

app.post("/login", (req, res) => {
  const data = req.body;

  collections.users.findOne({email: data.email, pass: data.pass}, (err, doc) => {
    res.json({success: doc != null, user: doc == null ? "" : doc._id});
  });
});

app.post("/users", (req, res) => {
  const {lmt, user} = req.body;

  collections.users.find({profileUpdated: true, $not: { _id: user }}).limit(lmt).exec((err, docs) => {
    collections.users.count({profileUpdated: true, $not: { _id: user }}, async function (err, count) {
      let _docs = [];

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        d.photo = await new Promise((resolve, reject) => {
          collections.profilephotos.findOne({user: d._id}, (err, pt) => {
            resolve(pt != null ? pt.photo : null);
          });
        });

        _docs.push(d);
      }

      res.json({users: _docs, reached: count <= lmt});
    });
  });
});

app.post("/filter", (req, res) => {
  const {lmt, user} = req.body;

  collections.users.find({profileUpdated: true, $not: { _id: user }}).limit(lmt).exec((err, docs) => {
    collections.users.count({profileUpdated: true, $not: { _id: user }}, async function (err, count) {
      let _docs = [];

      for (let i = 0; i < docs.length; i++) {
        const d = docs[i];
        d.photo = await new Promise((resolve, reject) => {
          collections.profilephotos.findOne({user: d._id}, (err, pt) => {
            resolve(pt != null ? pt.photo : null);
          });
        });

        _docs.push(d);
      }

      res.json({users: _docs, reached: count <= lmt});
    });
  });
});

app.post("/update", (req, res) => {
  const data = req.body;
  const {email, name, birthday, province, zone, profileIsPublic, tel, desc, interrests, gender, profession, user} = data;

  collections.users.update({ _id: user }, {
    $set: {
      email, name, birthday, province, zone, profileIsPublic, tel, desc, interrests, gender, profession,
      profileUpdated: true
    }
  }, { multi: true }, function (err, numReplaced) {
    // console.log(numReplaced)
  })

  res.json({success: true});
});

app.post("/privateuserinfo", (req, res) => {
  const _user = req.body.user;

  collections.users.findOne({_id: _user}, (err, doc) => {
    collections.profilephotos.findOne({user: doc._id}, (err, profilePhoto) => {
      const user = doc;
      if(profilePhoto != null) {
        const photo = profilePhoto.photo;
        res.json({...user, photo});
      } else {
        res.json(user);
      }
    })
  });
});


app.post("/uploadprofilephoto", (req, res) => {
  const data = req.body;
  const _time = Date.now().toString();
  collections.profilephotos.insert({user: data.user, photo: data.modalPhoto, time: _time});
  collections.profilephotos.remove({ $not: { time: _time}, user: data.user});
  res.json({success: true});
});

app.get("/test", (req, res) => {
  res.json({success: true});
});

app.get("/version", (req, res) => {
  res.json({version: "1.0.0"});
});

app.get("/updateviewsnumber/:id", (req, res) => {
  const id = req.params.id;

  collections.users.findOne({_id: id}, (err, user) => {
    if(user.numberOfViews == undefined) {
      collections.users.update({ _id: id }, {
        $set: {
          numberOfViews: 1
        }
      }, { multi: true }, function (err, numReplaced) {
        // console.log(numReplaced)
      });
    } else {
      collections.users.update({ _id: id }, {
        $set: {
          numberOfViews: user.numberOfViews + 1
        }
      }, { multi: true }, function (err, numReplaced) {
        // console.log(numReplaced)
      });
    }
  });

  res.json({});
});