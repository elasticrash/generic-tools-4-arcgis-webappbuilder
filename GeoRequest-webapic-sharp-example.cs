        public HttpResponseMessage PostRequest(DTO.GeoRequest data)
        {
            try
            {

                PatraDBEntities sds = new PatraDBEntities();
                if (data.geom == null)
                {
                    var entity = new requestgeo()
                    {
                        address = data.address,
                        area = data.area,
                        dd = data.dd,
                        email = data.email,
                        fname = data.FName,
                        lname = data.LName,
                        number = data.number,
                        request = data.request,
                        street = data.street
                    };
                    sds.requestgeos.Add(entity);
                }
                else
                {
                    var ft = JsonConvert.DeserializeObject<Polygon>(data.geom);
                    var st = JsonConvert.DeserializeObject<Envelope>(data.geom);
                    var gjson = ft.rings == null ? st.ToWKT() : ft.ToWKT();

                    var entity = new requestgeo()
                    {
                        address = data.address,
                        area = data.area,
                        dd = data.dd,
                        email = data.email,
                        fname = data.FName,
                        lname = data.LName,
                        number = data.number,
                        request = data.request,
                        street = data.street,
                        geom = DbGeometry.PolygonFromText(gjson, 2100)
                    };
                    sds.requestgeos.Add(entity);
                }
                sds.SaveChanges();

                return Request.CreateResponse(HttpStatusCode.OK, "Η Αίτηση σας Ολοκληρώθηκε με επιτυχία");
            }
            catch (Exception)
            {
                
                return Request.CreateResponse(HttpStatusCode.InternalServerError, "Παρουσιάστηκε πρόβλημα με την αιτησή σας");
            }
        }