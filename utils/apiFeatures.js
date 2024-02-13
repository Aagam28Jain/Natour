class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //FILTERING
    const queryObj = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    //kyuki hmko find method mai await lga hua hai to hm filtering saath nhi kr skte ye sirf find ka hi result dega to usko alag se kr rhe hai or sirf last operation mai await krenge
    //ADVANCE FILTERING
    //2)Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // req .query return the same filter object that we write in url
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //agar aap 2 param k basis pr sort krna chahte ho to
      //hmne url mai 2 param ese likhe hai ?sort=price,ratingavg
      //hmare query .sort()  fn ko chahiye ki jitne bhi param ho saare ek space k baad ese passs kro
      //ex. price ratingsAverage
      //to hmko krna ye hai , hta kr spaace lana hai
      const sortBy = this.queryString.sort.split(',').join(' ');

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  //kyuki hmko chahiye hm query mai name,duration likh rhe pr .select ko chahiye hm name duration iss format mai use bheje string to hm
  //   , se split krke vha  space jod rhe hai
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //- lgane se field exclude
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // if (this.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }

    return this;
  }
}
module.exports = ApiFeatures;
