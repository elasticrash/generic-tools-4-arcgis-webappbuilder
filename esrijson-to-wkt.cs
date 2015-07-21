using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.SqlServer.Types;
using Newtonsoft.Json;

namespace PatraWebGis.WKT
{
    public abstract class Geometry
    {
        //add methods to convert the geometry to/from WKT
        abstract public string ToWKT();
    }
    public class Point : Geometry
    {
        public double x { get; set; }
        public double y { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? z { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? m { get; set; }
        override public string ToWKT()
        {
            return "POINT(" + this.x.ToString() + " " + this.y.ToString() + ")";
        }
    }
    public abstract class MultiplePointGeometry : Geometry
    {
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public bool? hasZ { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public bool? hasM { get; set; }
    }
    public class Multipoint : MultiplePointGeometry
    {
        public List<List<double>> points { get; set; }
        public override string ToWKT()
        {
            string WKT = "MULTIPOINT(";
            for (int i = 0; i < this.points.Count; i++)
            {
                for (int j = 0; j < this.points[i].Count; j++)
                {
                    WKT += this.points[i][j].ToString();
                    if (j < this.points[i].Count - 1)
                    {
                        WKT += " ";
                    }
                }
                if (i < this.points.Count - 1)
                {
                    WKT += ",";
                }
            }
            WKT += ")";
            return WKT;
        }
    }
    public class Polyline : MultiplePointGeometry
    {
        public List<List<List<double>>> paths { get; set; }
        public override string ToWKT()
        {
            string points = "";
            for (int i = 0; i < this.paths.Count; i++)
            {
                points += "(";
                for (int j = 0; j < this.paths[i].Count; j++)
                {
                    for (int k = 0; k < this.paths[i][j].Count; k++)
                    {
                        points += this.paths[i][j][k].ToString();
                        if (k < this.paths[i][j].Count - 1)
                        {
                            points += " ";
                        }
                    }
                    if (j < this.paths[i].Count - 1)
                    {
                        points += ",";
                    }
                }
                points += ")";
                if (i < this.paths.Count - 1)
                {
                    points += ",";
                }
            }
            if (this.paths.Count > 1)
            {
                return "MULTILINESTRING" + points;
            }
            else
            {
                return "LINESTRING" + points;
            }
        }
    }
    public class Polygon : MultiplePointGeometry
    {
        public List<List<List<double>>> rings { get; set; }
        public override string ToWKT()
        {
            string ringpts = "";
            for (int i = 0; i < this.rings.Count; i++)
            {
                ringpts += "(";
                for (int j = 0; j < this.rings[i].Count; j++)
                {
                    for (int k = 0; k < this.rings[i][j].Count; k++)
                    {
                        ringpts += this.rings[i][j][k].ToString();
                        if (k < this.rings[i][j].Count - 1)
                        {
                            ringpts += " ";
                        }
                    }
                    if (j < this.rings[i].Count - 1)
                    {
                        ringpts += ",";
                    }
                }
                ringpts += ")";
                if (i < this.rings.Count - 1)
                {
                    ringpts += ",";
                }
            }
            if (this.rings.Count > 1)
            {
                return "MULTIPOLYGON" + ringpts;
            }
            else
            {
                return "POLYGON(" + ringpts +")";
            }
        }
    }
    public class Envelope : Geometry
    {
        public double xmin { get; set; }
        public double ymin { get; set; }
        public double xmax { get; set; }
        public double ymax { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? zmin { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? zmax { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? mmin { get; set; }
        [JsonProperty(NullValueHandling = NullValueHandling.Ignore)]
        public double? mmax { get; set; }
        override public string ToWKT()
        {
            return "POLYGON((" + this.xmin.ToString() + " " + this.ymin.ToString() + "," + this.xmin.ToString() + " " + this.ymax.ToString() + "," + this.xmax.ToString() + " " + this.ymax.ToString() + "," + this.xmax.ToString() + " " + this.ymin.ToString() + "," + this.xmin.ToString() + " " + this.ymin.ToString() + "))";
        }
    }
    public static class GeometryTypes
    {
        public const String Point = "esriGeometryPoint";
        public const String MultiPoint = "esriGeometryMultipoint";
        public const String Polyline = "esriGeometryPolyline";
        public const String Polygon = "esriGeometryPolygon";
        public const String Envelope = "esriGeometryEnvelope";
    }
}
     
