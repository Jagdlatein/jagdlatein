README

This data file is published by the Movebank Data Repository (www.datarepository.movebank.org). As of the time of publication, a version of this published animal tracking dataset can be viewed on Movebank (www.movebank.org) in the study "LifeTrack White Stork SW Germany" (Movebank Study ID 21231406). Individual attributes in the data files are defined below, in the NERC Vocabulary Server at http://vocab.nerc.ac.uk/collection/MVB and in the Movebank Attribute Dictionary at www.movebank.org/node/2381. Metadata describing this data package are maintained at https://datacite.org.

This published dataset contains data in the study "LifeTrack White Stork SW Germany" through 31 March, 2019. The study is ongoing and newer data are publicly available from the Movebank study.

This data package includes the following data files:
LifeTrack White Stork SW Germany_2013-2019-gps.csv.zip
LifeTrack White Stork SW Germany_2013-2019-acceleration-1of3.csv.zip
LifeTrack White Stork SW Germany_2013-2019-acceleration-2of3.csv.zip
LifeTrack White Stork SW Germany_2013-2019-acceleration-3of3.csv.zip
LifeTrack White Stork SW Germany_2013-2019-reference-data.csv

Data package citation:
Fiedler W, Flack A, Schäfle W, Keeves B, Quetting M, Eid B, Schmid H, Wikelski M (2019) Data from: Study "LifeTrack White Stork SW Germany" (2013-2019). Movebank Data Repository. https://doi.org/10.5441/001/1.ck04mn78

These data are described in the following written publications:
Cheng Y, Fiedler W, Wikelski M, Flack A (2019) "Closer-to-home" strategy benefits juvenile survival in a long-distance migratory bird. Ecology and Evolution. https://doi.org/10.1002/ece3.5395

Flack A, Fiedler W, Blas J, Pokrovski I, Kaatz M, Mitropolsky M, Aghababyan K, Fakriadis Y, Makrigianni E, Jerzak L, Azafzaf H, Feltrup-Azafzaf C, Rotics S, Mokotjomela TM, Nathan R, Wikelski M (2016) Costs of migratory decisions: a comparison across eight white stork populations. Science Advances 2(1): e1500931. https://doi.org/10.1126/sciadv.1500931

Weinzierl R, Bohrer G, Kranstauber B, Fiedler W, Wikelski M, Flack A (2016) Wind estimation based on thermal soaring of birds. Ecology and Evolution 6(24): 8706–8718. https://doi.org/10.1002/ece3.2585

A subset of this study and dataset was previously published as DOI 10.5441/001/1.bj96m274; the dataset published as DOI 10.5441/001/1.78152p3q contains a subset of this published dataset along with additional data.

Individuals from this dataset used in the analysis of Cheng et al. (2019) are listed below.

-----------

Terms of Use
This data file is licensed by the Creative Commons Zero (CC0 1.0) license. The intent of this license is to facilitate the re-use of works. The Creative Commons Zero license is a "no rights reserved" license that allows copyright holders to opt out of copyright protections automatically extended by copyright and other laws, thus placing works in the public domain with as little legal restriction as possible. However, works published with this license must still be appropriately cited following professional and ethical standards for academic citation.

We highly recommend that you contact the data creator if possible if you will be re-using or re-analyzing data in this file. Researchers will likely be interested in learning about new uses of their data, might also have important insights about how to properly analyze and interpret their data, and/or might have additional data they would be willing to contribute to your project. Feel free to contact us at support@movebank.org if you need assistance contacting data owners.

See here for the full description of this license
http://creativecommons.org/publicdomain/zero/1.0

-----------

Data Attributes
These definitions come from the Movebank Attribute Dictionary, available at www.movebank.org/node/2381.

animal comments: Additional information about the animal that is not described by other reference data terms.
example: sibling of #1423

animal death comments: Comments about the death of the animal.
example: hit by a car

animal exact date of birth: The exact date on which animal was born.
example: 2001-10-31 00:00:00.000
format: yyyy-MM-dd HH:mm:ss.sss
units: if time is not included, day is determined by local time; if time is included, times are in UTC

animal ID: An individual identifier for the animal, provided by the data owner. This identifier can be a ring number, a name, the same as the associated tag ID, etc. If the data owner does not provide an Animal ID, an internal Movebank animal identifier is sometimes shown.
example: 91876A, Gary
same as: individual local identifier

animal latest date born: The latest date an animal is thought to have been born.
example: 2001-12-12 00:00:00.000
formats: yyyy-MM-dd HH:mm:ss.sss
units: if time is not included, day is determined by local time; if time is included, times are in UTC

animal life stage: The age class or life stage of the animal at the beginning of the deployment. Can be years or months of age or terms such as "adult", "subadult" and "juvenile". Best practice is to define units in the values if needed (e.g. "2 years").
example: juvenile, adult
units: not defined

animal mass: The mass of an the animal, typically at the beginning of the deployment.
example: 500
units: grams

animal nickname: An alternate identifier for the animal. Used as the display name for animals shown in the Animal Tracker App.
example: Ali

animal ring ID: A number or color scheme for a band or ring attached to the animal.
example: 26225
units: none

animal sex: The sex of the animal. Allowed values are
m: male
f: female

animal taxon: The scientific name of the species on which the tag was deployed, as defined by the Integrated Taxonomic Information System (ITIS, www.itis.gov). If the species name can not be provided, this should be the lowest level taxonomic rank that can be determined and that is used in the ITIS taxonomy. Additional information can be provided using the term "taxon detail".
example: Buteo swainsoni
same as: species, individual taxon canonical name

animal taxon detail: A more specific name and/or reference for the taxon name provided by animal taxon. This can be used, for example, to specify a subspecies or a taxon not supported by the ITIS.
example: Calonectris diomedea borealis (Cory, 1881)
same as: animal taxon detail

attachment type: The way a tag is attached to an animal. Values are chosen from a controlled list:
collar: The tag is attached by a collar around the animal's neck.
glue: The tag is attached to the animal using glue.
harness: The tag is attached to the animal using a harness.
implant: The tag is placed under the skin of the an animal.
tape: The tag is attached to the animal using tape.
other: user specified

deploy off person: The name of the person/people who removed the tag from the animal and ended the deployment.
example: J. Smith

deploy off timestamp: The timestamp when the tag deployment ended.
example: 2009-10-01 12:00:00.000
format: yyyy-MM-dd HH:mm:ss.sss
units: UTC or GPS time, which is a few leap seconds different from UTC
same as: deploy off date

deploy on person: The name of the person/people who attached the tag to the animal and began the deployment.
example: G. Smith

deploy on timestamp: The timestamp when the tag deployment started.
example: 2008-08-30 18:00:00.000
format: yyyy-MM-dd HH:mm:ss.sss
units: UTC or GPS time, which is a few leap seconds different from UTC
same as: deploy on date

deployment comments: Additional information about the tag deployment that is not described by other reference data terms.
example: body length 154 cm; condition good

deployment end comments: a description of the end of a tag deployment, such as cause of mortality or notes on the removal and/or failure of tag.
example: Data transmission stopped after 108 days. Cause unknown.

deployment end type: A categorical classification of the tag deployment end. Values are chosen from a controlled list:
captured: The tag remained on the animal but the animal was captured or confined.
dead: The deployment ended with the death of the animal that was carrying the tag.
equipment failure: The tag stopped working.
fall off: The attachment of the tag to the animal failed, and it fell of accidentally.
other
released: The tag remained on the animal but the animal was released from captivity or confinement.
removal: The tag was purposefully removed from the animal.
unknown: The deployment ended by an unknown cause.

deployment ID: A unique identifier for the deployment of a tag on animal, provided by the data owner. If the data owner does not provide a Deployment ID, an internal Movebank deployment identifier may sometimes be shown.
example: Jane-Tag42

duty cycle: Remarks associated with the duty cycle of a tag during the deployment, describing the times it is on/off and the frequency at which it transmits or records data. Units and time zones should be defined in the remarks.
example: 15-min fixes from 8:00-18:00 local time (0:00-10:00 UTC)

event ID: An identifier for the set of values associated with each event, i.e. sensor measurement. A unique event ID is assigned to every time-location or other time-measurement record in Movebank. If multiple measurements are included within a single row of a data file, they will share an event ID. If users import the same sensor measurement to Movebank multiple times, a separate event ID will be assigned to each.
example: 6340565
units: none

e-obs acceleration axes: This tells you about the enabled ACC axes, like X and/or Y and/or Z (definition from "e-obs GPS-acceleration-tags application note: How to use the acceleration sensor, interpret, analyse its data and how to get values in m/s^2", 2011).
example: XYZ
units: none

e-obs acceleration sampling frequency per axis: This is the sampling frequency for one axis. Don't mix this up with the sampling frequency for all axes together. For example if you have three ACC axes enabled, then the sampling frequency for all axes together is three times the sampling frequency for one axis. The sampling frequency is measured in Hertz, which is the same as 1/second. For example a sampling frequency of 10 Hz means that you get 10 samples per second (definition from "e-obs GPS-acceleration-tags application note: How to use the acceleration sensor, interpret, analyse its data and how to get values in m/s^2", 2011).
example: 5.93
units: hertz (Hz)

e-obs accelerations raw: Acceleration along the X and or Y and or Z axes of the tag, depending on which axes were activated on the tag as described in e-obs acceleration axes. Measurements alternate one measurement for each active axis in alphabetical order. The values are digital readings between 0 and 4095 of the analogue digital converter on the tag, and can be converted to m/s^2 with proper calibration. These samples are made at the rate described by e-obs acceleration sampling frequency per axis starting with the first sample at the time described in e-obs start timestamp. Tags with numbers e-obs numbers 2242 and higher, which began being provided in spring 2012, have Y-axis values in the opposite direction from those in older tags (definition from "e-obs GPS-acceleration-tags application note: How to use the acceleration sensor, interpret, analyse its data and how to get values in m/s^2", 2011; Wolgang Heidrich, e-obs Digital Telemetry, personal communication, 2012).
example: 1844 1889 1653 1845 1896 1653 1837 1897 1653 1842 1898 1650 1844 1899 1644 1840…
units: not defined

e-obs battery voltage: Unloaded battery voltage (definition from Franz Kümmeth, e-obs Digital Telemetry, personal communication, 2012).
example: 3712
units: millivolt (mV)

e-obs fix battery voltage: Loaded battery voltage, i.e. battery voltage when GPS module is acquiring a fix (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010; Franz Kümmeth, e-obs Digital Telemetry, personal communication, 2012).
example: 3535
units: millivolt (mV)

e-obs horizontal accuracy estimate: A horizontal (in)accuracy estimate, calculated by the GPS module (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010; Franz Kümmeth, e-obs Digital Telemetry, personal communication, 2012).
example: 35.07
units: meters

e-obs key bin checksum: A checksum of the original binary data, so that Movebank can quickly compare different lines by comparing their checksums (definition from "e-obs GPS-acceleration-tags application note: How to use the acceleration sensor, interpret, analyse its data and how to get values in m/s^2", 2011).
example: 4152324118
units: none

e-obs speed accuracy estimate: A speed (in)accuracy estimate, calculated by the GPS module. The speed accuracy estimate (better named "inaccuracy estimation")  may show very high values, since the GPS module calculates a very conservative value. These speed measurements are potentially very inaccurate when interpreting the data (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010; Franz Kümmeth, e-obs Digital Telemetry, personal communication, 2012).
example: 6.58
units: meters per second

e-obs start timestamp: The date and time of day when the acceleration burst belonging to this line begins. The exact time of the first sample is a little later (up to 1 second) for older e-obs tags, especially when the ACC-pinger is enabled (4 pings before the start of each ACC burst) (definition from "e-obs GPS-acceleration-tags application note: How to use the acceleration sensor, interpret, analyse its data and how to get values in m/s^2", 2011).
example: 2011-01-03 13:45:00.000
units: GPS time (GPST), which is a few leap seconds different from UTC

e-obs status: The record status, from e-obs GPS/accelerometer tags (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010). Allowed values are
A = position and time within accuracy masks
B = only time of week and weeknumber valid
C = only weeknumber valid
D = no valid data
example: D
units: none

e-obs temperature: Temperature; this value is not calibrated and therefore very inaccurate (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010).
example: 45
units: degrees Celsius

e-obs type of fix: The type of fix of data from e-obs GPS/accelerometer tags (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010). Allowed values are
3 = 3D fix
2 = 2D fix
example: 3
units: none

e-obs used time to get fix: The amount of time that was needed for this GPS fix; interesting for estimating power requirements (definition from e-obs Digital Telemetry Manual for DataDecoder Software, 2010).
example: 22
units: seconds

ground speed: The estimated ground speed provided by the sensor or calculated between consecutive locations.
example: 7.22
units: meters per second

heading: The direction in which the tag is moving, in decimal degrees clockwise from north, as provided by the sensor or calculated between consecutive locations. Values range from 0–360: 0 = north, 90 = east, 180 = south, 270 = west.
example: 315.88
units: degrees clockwise from north

height above ellipsoid: The estimated height above the ellipsoid returned by the tag. (If altitudes are calculated as height above mean sea level, use height above mean sea level.)
example: 24.8
units: meters

location lat: The geographic longitude of the location as estimated by the sensor. Positive values are east of the Greenwich Meridian, negative values are west of it.
example: -121.1761111
units: decimal degrees, WGS84 reference system

location long: The geographic longitude of the location as estimated by the sensor. Positive values are east of the Greenwich Meridian, negative values are west of it.
example: -121.1761111
units: decimal degrees, WGS84 reference system
same as: location long

manipulation type: The way in which the animal was manipulated during the deployment. Additional details about the manipulation can be provided using "manipulation comments". Values are chosen from a controlled list:
confined: The animal's movement was restricted to within a defined area.
none: The animal received no treatment other than the tag attachment.
relocated: The animal was released from a site other than the one at which it was captured.
manipulated other: The animal was manipulated in some other way, such as a physiological manipulation.

sensor type: The type of sensor with which data were collected. All sensors are associated with a tag id, and tags can contain multiple sensor types. Values are chosen from a controlled list:
acceleration: The sensor collects acceleration data.
accessory measurements: The sensor collects accessory measurements, such as battery voltage.
Argos Doppler shift: The sensor is using Argos Doppler shift for determining position.
barometer: The sensor records air or water pressure.
bird ring: The animal is identified by a ring that has a unique ID.
GPS: The sensor uses GPS to find location and stores these.
magnetometer: The sensor records the magnetic field.
natural mark: The animal is identified by a natural marking.
radio transmitter: The sensor is a classical radio transmitter.
solar geolocator: The sensor collects light levels, which are used to determine position (for processed locations).
solar geolocator raw: The sensor collects light levels, which are used to determine position (for raw light-level measurements).

study name: The name of the study in Movebank.

study site: A location such as the deployment site or colony, or a location-related group such as the herd or pack name.
example: Pickerel Island North

beacon frequency: The frequency of the radio tag or tag retrieval beacon.
example: 450.5
units: MHz
same as: tag beacon frequency

tag comments: Additional information about the tag that is not described by other reference data terms.
example: custom-made Doppler shift Argos tag with a special altitude sensor

tag ID: A unique identifier for the tag, provided by the data owner. If the data owner does not provide a tag ID, an internal Movebank tag identifier may sometimes be shown.
example: 2342
same as: tag local identifier

tag manufacturer name: The company or person that produced the tag.
example: Holohil

tag mass: The mass of the tag.
example: 24
units: grams

tag model: The model of the tag.
example: T61

tag production date: The approximate date the tag was produced (can be a year, month, or day).
example: March 2011
units: undefined

tag readout method: The way the data are received from the tag. Values are chosen from a controlled list:
satellite: Data are transferred via satellite.
phone network: Data are transferred via a phone network, such as GSM or AMPS.
other wireless: Data are transferred via another form of wireless data transfer, such as a VHF radio transmitter/receiver.
tag retrieval: The tag must be physically retrieved in order to obtain the data.

tag serial number: The serial number of the tag.
example: MN93-33243
units: none
same as: tag serial no

timestamp: The date and time a sensor measurement was taken.
example: 2008-08-14 18:31:00.000
format: yyyy-MM-dd HH:mm:ss.sss
units: UTC or GPS time, which is a few leap seconds different from UTC

visible: Determines whether an event is visible on the Movebank Search Map. Values are calculated automatically, with TRUE indicating the event has not been flagged as an outlier by "algorithm marked outlier", "import marked outlier" or "manually marked outlier", or that the user has overridden the results of these outlier attributes using "manually marked valid" = TRUE. Allowed values are TRUE or FALSE.
THIS DATASET: This study contains a large number of records with duplicate tag and timestamp due to data obtained both through GSM and (more complete) records sometimes also downloaded from base stations. These duplicates were flagged as outliers (manually-marked-outlier = TRUE), with a preference for retaining the more complete record. These flagged duplicates along with a small number of other marked outliers are excluded from the published data files.

-----------

Individuals from this dataset used in the analysis of Cheng et al. (2019)

local_identifier	hatching.rank	survival.daysAmadeus / DER AY620 (eobs 5703)	1	117Angela / DER AY470 (eobs 4001)	NA	232Anton + / DER AV859 (eobs 4004)	1	5Balou + / DER AN916 (eobs 3913)	2	53Bello + / DER AU011 (eobs 3935)	2	33Benjamin + / DER AN867 (eobs3030)	1	18Beringa + / DER AN869 (eobs 3645)	2	49Betty + / DER AU059 (eobs 3342)	3	60Blacky + / DER AU078 (eobs 2647)	2	75Bubbel + / DER AN873 (eobs 3666)	4	189Cherry + / DER AN859 (eobs3026)	2	27Chompy + / DER AN871 (eobs3647)	1	237Coco + / DER AN862 (eobs2668)	3	195Conchito + / DER AU005 (eobs 3927)	3	240Cookie + / DER AU008 (eobs 3930)	4	106Eamy + / DER AL585 (eobs3063)	1	216Ekky + / DER AU007 (eobs 3929)	2	205Ella + / DER AU051 (eobs 3338)	3	35Emil + / DER AV348 (eobs 4001)	1	130Eugen + / DER A1A27 (eobs 5523)	1	62Europa / DER A1A26 (eobs 4004)	2	238Fanny + / DER AN921 (eobs 3920)	2	22Fifi + / DER AN909 (eobs 3906)	1	215Flower + / DER AN925 (eobs 3932)	1	31Flummy + / DER AN912 (eobs 3909)	2	55Frank Elstner + / DER AN911 (eobs 3908)	1	100Hannibal + / DER AU063 (eobs 2848)	2	37Hans + / DER AN923 (eobs 3922)	1	52Jackie + / DER AN870 (eobs 3646)	3	51Julia + / DER AU002 (eobs 3924)	3	228Kai + / DER AU013 (eobs 3937)	3	27Kakau + / DER AN864 (eobs3041)	1	132Karamell + / DER AL582 (eobs3031)	3	233Kasimir + / DER AU062 (eobs 3265)	3	61Keks + / DER AN860 (KN2024)	1	34Kiki + / DER AN872 (eobs 3648)	2	102Kim + / DER AU060 (eobs 3060)	1	30Konstantina + / DER AU001 (eobs 3923)	2	48Kristall + / DER AU006 (eobs 3928)	1	165Lewis + / DER AU015 (eobs 3939)	2	89Lloyd + / DER AU016 (eobs 3940)	1	228Louis / DER AU050 (eobs 3264)	3	231Lucky + / DER AU061 (eobs 3087)	1	56Max + / DER AU046 (eobs 3945)	4	206Mirabell / DER AN910 (eobs 3907)	2	240MSWi + / DER AN924 (eobs 3931)	2	51Muffine / DER AN922 (eobs 3921)	3	217Niclas / DER AU053 (eobs 3341)	2	229Nils + / DER AU058 (eobs 3335)	2	175Ohnezahn + / DER AU056 (eobs 2711)	1	32Olea + / DER AN868 (eobs 3644)	1	65Peaches + / DER AN917 (eobs 3916)	3	30Pieps + / DER AL586 (KN2021)	1	41Pjotre + / DER AU003 (eobs 3925)	1	90Redrunner / DER AU057 (eobs 3339)	2	211Ronja + / DER AU004 (eobs 3926)	4	190Sara / DER AU017 (eobs 3941)	3	223Schwitza + / DER AN920 (eobs 3919)	3	82Sierit  / DER AN858 (eobs2561)	1	216Sierit-chick + / DER AZ347 (eobs 4565)	1	34Sipp + / DER AU009 (eobs 3933)	3	74Slanda + / DER AU048 (eobs 3965)	2	7Snowy + / DER AU077 (eobs 3336)	1	23Spiderwoman + / DER AU047 (eobs 3964)	1	25Tammy + / DER AN918 (eobs 3917)	1	229Tobi + / DER AU052 (eobs 3340)	1	231Toto + / DER AN919 (eobs 3918)	1	49Wanderer + / DER AU049 (eobs 3337)	4	114Wibi 1 + / DER AU043 (eobs 3942)	2	45Wibi 2 + / DER AU044 (eobs 3943)	3	210Wibi 3 + / DER AU045 (eobs 3944)	1	38Willi + / DER AN863 (eobs3040)	2	27Yolo + / DER AN861 (eobs2666)	1	233Zeffro + / DER AN914 (eobs 3912)	1	31Zlipi + / DER AU010 (eobs 3934)	1	228Zozu / DER AL581 (eobs2541)	2	217

-----------

More Information
For more information about this repository, see www.movebank.org/node/15294, the FAQ at www.movebank.org/node/2220, or contact us at support@movebank.org.