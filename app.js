const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const mongoURL = process.env.MONGOURL;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", true);

mongoose.connect(mongoURL);

const itemSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemSchema],
};

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = Item({
  name: "Welcome to your To-Do List!",
});

const item2 = Item({
  name: "Hit the + to add new tasks",
});

const item3 = Item({
  name: "Hit the checkbox to delete tasks",
});

const deafultItems = [item1, item2, item3];

// home
app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length == 0) {
      Item.insertMany(deafultItems, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("inserted default items into db");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save((err, result) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, (err, result) => {
      result.items.push(item);
      result.save();
      res.redirect("/" + listName);
    });
  }
});

// custom lists
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, result) => {
    if (!err) {
      if (result) {
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      } else {
        const list = new List({
          name: customListName,
          items: deafultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  });
});

// deleting items
app.post("/delete", (req, res) => {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndDelete(checkedItemID, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      (err, results) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started");
});
