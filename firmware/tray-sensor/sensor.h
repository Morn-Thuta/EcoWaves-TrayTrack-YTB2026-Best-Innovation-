#ifndef SENSOR_H
#define SENSOR_H

#include <HX711.h>

void initHX711();
float readWeight();
float getAveragedWeight(int samples);
void runCalibration();
bool loadCalibrationFromSPIFFS();
void saveCalibrationToSPIFFS(float factor, long offset);

#endif
