var cors = require('cors')
var express = require('express');
var compress = require('compression');
var app = express();
app.use(cors());
app.use(compress());

app.get('/data', function(req, res){
						var request = req.query['request'] || 'getCapabilities';
						var bbox = req.query['bbox'];
						var query = req.query['query'];
						var schema = req.query['schema'] || 'public';
						var table = req.query['table'];
						var id = req.query['id_column'] || 'ogc_fid';
						var geom = req.query['geom_column'] || 'geom';
						var srid = req.query['srid'] || 4326;
						var attributes = req.query['attributes'] || [id];
						//console.log('bbox: ', bbox);
						
   					var pg = require('pg'); 
            var client = new pg.Client({
							user: 'geodan',
							password: 'password',
							database: 'research',
							host: 'titania',
							port: 5432
						});
/*
						var client = new pg.Client({
							user: 'geodbadmin',
							password: 'G30d@n!',
							database: 'geodbo',
							host: 'luna',
							port: 5432
						});
						
*/						
            client.connect(function(err) {
              if(err) {
                res.send('could not connect to postgres');
              }
              
              if (request == 'getCapabilities' && table == null){
              	var querystring = "SELECT "
										+"f_table_schema as schema, " 
										+"f_table_name as table, "
										+"f_geometry_column geomcol, "
										+"srid, "
										+"type "
										+"FROM geometry_columns "
										+"WHERE srid > 0;";
              }
              else if (request == 'getCapabilities' && table && schema){
              	var querystring = "SELECT "
									+"column_name, "
									+"udt_name, "
									+"character_maximum_length "
									+"FROM information_schema.columns " 
									+"WHERE table_name = '" + table + "' "
									+"AND table_schema = '" + schema + "';";
              }
              else {
								var bboxstring = "ST_Transform(ST_MakeEnvelope(" + bbox +",900913),"+srid+")";
								var querystring = "SELECT "+id+" as id,"+attributes+", ST_AsTWKB(ST_Transform(ST_Intersection("+geom+","+bboxstring+"),4326),7) geom "
									+"FROM "+table+ " "
									+"WHERE ST_IsValid("+geom+") AND ST_Intersects("+geom+", "+bboxstring+") LIMIT 100000";
              }
							client.query(querystring, function(err, result) {
                if(err) {
                 console.warn(err, querystring); 
                }
                //console.log(querystring);
                res.set("Content-Type", 'text/javascript'); // i added this to avoid the "Resource interpreted as Script but transferred with MIME type text/html" message
                res.send(JSON.stringify({data: result.rows}));
                		console.log('Sending results', result.rows.length);
                    client.end();
              });
            }); 

});

app.get('/', function (req, res) {
  res.send('Hello World!');
});


app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
