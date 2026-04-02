#ifndef NETWORK_H
#define NETWORK_H

void connectWiFi();
bool isWiFiConnected();
int uploadReading(float weightGrams, int readingsCount, unsigned long timestamp);
void flushBuffer();

#endif
