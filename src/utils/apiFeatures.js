class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1a) filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1b) advance filtering
    let queryStr = JSON.stringify(queryObj);

    // replacing gte, lte, gt & lt with $gte, $lte, $gt & $lt (mongoose query operators)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // to chain other methods need to return the whole object
    return this;
  }

  sort() {
    // 2) sorting data
    if (this.queryString.sort) {
      // sort from query
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // if no sort query send the newest will be shown first
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    // 3) selected data fields
    if (this.queryString.fields) {
      // selected properties are send as response
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // deselecting the mongoose __v property
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    // 4) pagination
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
