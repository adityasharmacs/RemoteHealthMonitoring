import org.apache.spark._
import org.apache.spark.sql._
import org.apache.spark.ml.util._
import org.apache.spark.ml.classification.MultilayerPerceptronClassifier
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.classification.MultilayerPerceptronClassificationModel

object ecg {
  def main(args: Array[String]) {
	val sc = new SparkContext
        val sqlContext = new org.apache.spark.sql.SQLContext(sc)
	  // Load the data stored in LIBSVM format as a DataFrame.
	val data = sqlContext.read.format("libsvm")
	  .load("/home/ubuntu/ann-ecg/ecg.txt")
	// Split the data into train and test
	val splits = data.randomSplit(Array(0.6, 0.4), seed = 1234L)
	val train = splits(0)
	val test = splits(1)
	test.take(5).foreach {
		x => println ("test is " + x)
	}
	// specify layers for the neural network:
	// input layer of size 20 (features), two intermediate of size 5 and 4
	// and output of size 16 (classes)
	val layers = Array[Int](14, 50, 45, 12)
	// create the trainer and set its parameters
	val trainer = new MultilayerPerceptronClassifier()
	  .setLayers(layers)
	  .setBlockSize(128)
	  .setSeed(1234L)
	  .setMaxIter(100)
	// train the model
	val model = trainer.fit(train)
	model.save("/home/ubuntu/trained-model")
	// compute precision on the test set
	val result = model.transform(test)
	val predictionAndLabels = result.select("prediction", "label")
	val evaluator = new MulticlassClassificationEvaluator()
	  .setMetricName("accuracy")
	println("Accuracy:" + evaluator.evaluate(predictionAndLabels))
	}
}
