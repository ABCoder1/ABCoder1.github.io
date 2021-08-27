#!/usr/bin/env python
# coding: utf-8

# In[1]:


from keras.models import Sequential
from keras.layers import Dense
from keras.layers import Conv2D   #adding convolution layer : Cl for feature mapping 
from keras.layers import MaxPooling2D  # to extract the exact pooling
from keras.layers import Flatten # multi to single dimential 


# In[2]:


#preprocessing is done in the convolution layer min preprocessing required
model = Sequential()


# In[3]:


model.add(Conv2D(32,3,3, input_shape = (64,64,3), activation = 'relu')) #params 1. no.of feature detectors 2 n 3. size of the feature detector matrix i.e., here 3*3 4. i/p layer i.e., no.of pixcels containing rows, cloumns, channels for grayscale imgs i.e, bnw imgs then channel =1 else channel = 3 5. at times the result might b negative pixcels to avoid the negative pixcels in CNN we use activitation function using the activation function non linearity can also b removed.


# In[4]:


model.add(MaxPooling2D(pool_size = (2,2))) #mention the pool size i.e, from the big img a small matrix here a 2*2 matrix is taken n the max feature is taken


# In[5]:


model.add(Flatten()) #image features r there n then this is given as the i/p to the ANN layer


# In[6]:


model.add(Dense(output_dim=128,activation = 'relu', init='random_uniform'))


# In[7]:


model.add(Dense(output_dim=1 ,activation = 'sigmoid', init='random_uniform'))


# In[8]:


model.compile(optimizer = 'adam' , loss= 'binary_crossentropy', metrics = ['accuracy'])


# In[9]:


from keras.preprocessing.image import ImageDataGenerator  #preprocess the images based on the mentioned parameters


# In[10]:


train_datagen = ImageDataGenerator(rescale = 1./255, shear_range = 0.2 , zoom_range = 0.2, horizontal_flip = True) #to the images we apply few geometrical transformations to avoid over fitting
test_datagen = ImageDataGenerator(rescale = 1./255)


# In[11]:


x_train = train_datagen.flow_from_directory(r'D:\Documentation\SUBJECTS\Computer Science\Artificial Intelligence\CNN cat n dog\training_set', target_size = (64,64),  batch_size = 32, class_mode = 'binary')
x_test = train_datagen.flow_from_directory(r'D:\Documentation\SUBJECTS\Computer Science\Artificial Intelligence\CNN cat n dog\test_set', target_size = (64,64),  batch_size = 32, class_mode = 'binary')


# In[12]:


print(x_train.class_indices)  # to represent wat represents wat


# In[13]:


model.fit_generator(x_train, samples_per_epoch = 8000, epochs = 10, validation_data = x_test, nb_val_samples = 2000) #testing n training is done at the same time hence results produces 2 accuracies 1. acc i.e, training accuracy 2. val_acc i.e., validation or testing accuracy


# In[ ]:




