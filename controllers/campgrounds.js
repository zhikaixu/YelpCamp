const Campground = require('../models/campground');
const {cloudinary} = require("../cloudinary");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render("campgrounds/new")
}

module.exports.createCampground = async (req, res, next) => {
    // res.send(req.body.campground); // req.body need to be parsed!!
    // try {
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
    // const campgroundSchema = Joi.object({
    //     campground: Joi.object({
    //         title: Joi.string().required(),
    //         price: Joi.number().required.min(0),
    //         image: Joi.string().required(),
    //         location: Joi.string().required(),
    //         description: Joi.string().required()
    //     }).required()
    // })
    // // const result = campgroundSchema.validate(req.body);
    // // if (result.error) {
    // //     throw new ExpressError(result.error.details, 400);
    // // }
    // const {error} = campgroundSchema.validate(req.body);
    // if (error) {
    //     const msg = error.details.map(el => el.message).join(",")
    //     // throw new ExpressError(result.error.details, 400);
    //     throw new ExpressError(msg, 400);
    // }
    // console.log(result);
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 2
    }).send()
    // console.log(geoData.body);
    // res.send("OK!!!")
    const campground = new Campground(req.body.campground);
    // console.log(campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({url: f.path, filename: f.filename}))
    campground.author = req.user._id;
    // console.log(campground.images[0].url)
    await campground.save();
    req.flash('success', 'Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`)
}
    // catch(e) {
    //     next(e)
    // }

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    console.log(campground)
    if (!campground) {
        req.flash("error", "Cannot find that campground!")
        res.redirect("/campgrounds")
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
        req.flash("error", "Cannot find that campground!")
        return res.redirect("/campgrounds");
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    // res.send("It worked!")
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    campground.images.push(...imgs)
    await campground.save()
    if (req.body.deleteImages) {
        for(let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }

        await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
        // console.log(campground)
    }
    req.flash("success", 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted a campground!");
    res.redirect(`/campgrounds`)
}