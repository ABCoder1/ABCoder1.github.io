#!/usr/bin/env python
# coding: utf-8

# In[1]:


import cv2,time


# In[2]:


video=cv2.VideoCapture(0)


# In[6]:


from keras.models import load_model
from skimage.transform import resize
import numpy as np
import cv2
model=load_model(r"D:\Documentation\SUBJECTS\Computer Science\Artificial Intelligence\final_project\face_real_fake_model.h5")


# In[ ]:


model.compile(optimizer="adam", loss="binary_crossentropy",metrics=['accuracy'])


# In[ ]:


def detect(frame):
    try:
        img=resize(frame,(64,64))
        img=np.expand_dims(img,axis=0)
        if(np.max(img)<1):
            img=img/255.0
        prediction=model.predict(img)
       # print(prediction)
        prediction_class=model.predict_classes(img)
        if prediction<0.5:
            return 'Fake'
        else:
            return "Real"
        #print(prediction_class)
    except AttributeError:
        print("Shape not found!")


# In[ ]:


while True:
    check, frame =video.read()
    cv2.putText(frame,detect(frame),(450,30),cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,255))
    cv2.imshow("Capturing",frame)
    key=cv2.waitKey(1)
    if key==ord('q'):
        break
video.release()
cv2.destroyAllWindows


# In[ ]:


# fig, ax = plt.subplots()
# ax.scatter(y,y_pred)
# ax.plot([y.min(),y.max()],[y.min(),y.max()],"k--", lw=4)
# ax.set_xlabel('Measured')
# ax.set_ylabel('Predicted')
# plt.show()

