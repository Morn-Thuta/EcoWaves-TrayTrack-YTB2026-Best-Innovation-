#ifndef BUFFER_H
#define BUFFER_H

struct BufferEntry {
  float weightGrams;
  int readingsCount;
  unsigned long timestamp;
};

void initBuffer();
void bufferPush(float weightGrams, int readingsCount, unsigned long timestamp);
bool bufferPop(BufferEntry* entry);
int bufferCount();
bool isBufferEmpty();
void flushSPIFFSBuffer();

#endif
